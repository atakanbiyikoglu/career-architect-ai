import {
    appState,
    userData,
    riasecQuestions,
    oceanQuestions,
    testAnswers,
    TYPING_DELAY
} from './state.js';
import {
    initUI,
    getChatMessages,
    addBotMessage,
    addUserMessage,
    addOptions,
    hideLatestOptionGroup,
    showTyping,
    hideTyping,
    setInputState,
    clearChatPreserveTyping
} from './ui.js';
import {
    startExperiment,
    submitTestResultsApi,
    submitFeedbackApi,
    unlockAiReport
} from './api.js';
import {
    createExportContext,
    normalizeHistoricExportContext,
    hasValidScores,
    offerExportAndPrompt
} from './pdf.js';

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');
const submitBtn = chatForm.querySelector('button');
const newAnalysisBtn = document.getElementById('new-analysis-btn');

initUI({ chatMessages, userInput, submitBtn, typingIndicator });

document.addEventListener('DOMContentLoaded', () => {
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    setupModalHandlers();
    registerServiceWorker();

    showTyping();
    setTimeout(() => {
        hideTyping();
        addBotMessage('Merhaba! Ben Kariyer Mimari AI. TUBITAK 2209-A kapsaminda gelistirilen bu platform, Ilgi ve Kisilik testlerini yapay zeka ile sentezleyerek sana en uygun Bilisim kariyerini cizer. (Teste baslayarak akademik aydinlatma metnini onaylamis sayilirsin).');

        setTimeout(() => {
            addBotMessage('Baslamadan once seni taniyalim, adin nedir?');
            setInputState(true, 'Mesajini yaz...');
        }, 500);
    }, TYPING_DELAY);
});

window.sendMessage = sendMessage;

function setupModalHandlers() {
    const aboutBtn = document.getElementById('about-btn');
    const historyBtn = document.getElementById('history-btn');
    const aboutModal = document.getElementById('about-modal');
    const historyModal = document.getElementById('history-modal');
    const modalCloses = document.querySelectorAll('.modal-close');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    if (aboutBtn) {
        aboutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.classList.remove('hidden');
        });
    }

    if (historyBtn) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadAnalysisHistoryModal();
            historyModal.classList.remove('hidden');
        });
    }

    modalCloses.forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });

    modalOverlays.forEach((overlay) => {
        overlay.addEventListener('click', () => {
            overlay.closest('.modal').classList.add('hidden');
        });
    });
}

function loadAnalysisHistoryModal() {
    const historyList = document.getElementById('history-modal-list');
    const historyEmpty = document.getElementById('history-empty');
    const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');

    historyList.innerHTML = '';

    if (analyses.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }

    historyEmpty.style.display = 'none';

    analyses.slice().reverse().forEach((analysis) => {
        const item = document.createElement('div');
        item.className = 'history-modal-item';

        const info = document.createElement('div');
        info.className = 'history-modal-item-info';

        const name = document.createElement('p');
        name.className = 'history-modal-item-name';
        name.textContent = analysis.name;

        const date = document.createElement('p');
        date.className = 'history-modal-item-date';
        date.textContent = analysis.date;

        info.appendChild(name);
        info.appendChild(date);

        const actions = document.createElement('div');
        actions.className = 'history-modal-item-actions';

        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'history-modal-btn';
        pdfBtn.textContent = '👁️ Önizle ve PDF';
        pdfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('history-modal').classList.add('hidden');
            previewHistoricAnalysisForExport(analysis);
        });

        actions.appendChild(pdfBtn);
        item.appendChild(info);
        item.appendChild(actions);
        historyList.appendChild(item);
    });
}

function loadAnalysisHistory() {
    // History rendering moved into modal; this keeps old calls safe.
}

async function previewHistoricAnalysisForExport(analysis) {
    clearChatPreserveTyping();

    addBotMessage('İşte geçmiş kariyer analizin. İnceleyebilir veya yapay zeka mentorlüğü için dışa aktarabilirsin:');
    addBotMessage(analysis.report || '<p>Rapor bulunamadi.</p>', true);

    appState.latestExportContext = normalizeHistoricExportContext(analysis);

    if (!appState.latestExportContext || !hasValidScores(appState.latestExportContext)) {
        addBotMessage('❌ Maalesef bu eski analiz için detaylı PDF/Prompt exportu desteklenmiyor. Yeni bir test çözmek ister misin?');
        return;
    }

    await offerExportAndPrompt(appState.latestExportContext);
}

function saveAnalysisToHistory(name, reportHtml, exportContext = null) {
    const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

    analyses.push({
        name,
        date: dateStr,
        report: reportHtml,
        timestamp: now.getTime(),
        exportContext
    });

    localStorage.setItem('analyses', JSON.stringify(analyses));
    loadAnalysisHistory();
}

function formatReport(reportText) {
    const escaped = reportText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    let html = '';
    let inList = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<h3>${trimmed.replace('### ', '')}</h3>`;
            continue;
        }

        if (trimmed.startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${trimmed.slice(2)}</li>`;
            continue;
        }

        if (inList && trimmed.length === 0) {
            html += '</ul>';
            inList = false;
            continue;
        }

        const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (trimmed.length > 0) {
            html += `<p>${withBold}</p>`;
        }
    }

    if (inList) html += '</ul>';
    return html || `<p>${escaped}</p>`;
}

function addLinkedInShareOption(reportText) {
    const summary = String(reportText || '').slice(0, 500);
    const shareText = `Kariyer Mimari AI ile psikometrik analizimi tamamladim. Ozet: ${summary}`;
    const hashtags = '#kariyer #yapayzeka #riasec #ocean #tubitak2209a';
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${shareText}\n${hashtags}`)}`;

    addBotMessage(
        `Sonucunu LinkedInde paylasmak istersen: <a href="${linkedInUrl}" target="_blank" rel="noopener noreferrer">LinkedIn'de Paylas</a>`,
        true
    );
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch((err) => {
                console.error('Service worker kaydi basarisiz:', err);
            });
        });
    }
}

function askSatisfactionSurvey() {
    appState.flowState = 'FEEDBACK';
    showTyping();

    setTimeout(() => {
        hideTyping();

        const experimentGroup = localStorage.getItem('experiment_group');
        let feedbackMessage;

        if (experimentGroup === 'A') {
            feedbackMessage = 'Analiz raporunu nasıl buldun? 🌟 (💡 İpucu: Puanlamanı yaptıktan sonra sana özel, gelişmiş bir **Yapay Zeka (AI) sürprizimiz** olacak! 🎁) Lütfen 1\'den 5\'e kadar bir puan yazarak gönder:';
        } else {
            feedbackMessage = 'Sana özel hazırladığım bu yapay zeka raporunu nasıl buldun? 🌟 (💡 İpucu: Puanlamanı yaptıktan sonra bu verilerle kendi ChatGPT\'nde çalışabilmen için sana **özel bir komut (prompt)** hediye edeceğim!) Lütfen 1\'den 5\'e kadar bir puan yazarak gönder:';
        }

        addBotMessage(feedbackMessage);

        const ratingOptions = [1, 2, 3, 4, 5].map((score) => ({
            label: `⭐ ${score}`,
            value: score
        }));

        addOptions(ratingOptions, handleOptionClick, true);
    }, 700);
}

async function submitFeedback(score) {
    const participantId = localStorage.getItem('participant_id');
    if (!participantId) {
        addBotMessage('Geri bildirim kaydedilemedi: katilimci kimligi bulunamadi.');
        appState.flowState = 'FINISHED';
        setInputState(false, 'Deney tamamlandi.');
        return;
    }

    showTyping();
    try {
        await submitFeedbackApi({ participantId, satisfaction_score: score });
        hideTyping();

        const experimentGroup = localStorage.getItem('experiment_group');

        if (experimentGroup === 'A') {
            addBotMessage('Geri bildirimin icin tesekkurler! Simdi verilerini Gercek Yapay Zeka (Gemini) modelimize gonderiyorum.');
            showTyping();
            addBotMessage('Yapay Zeka analiz ediyor...');

            try {
                const unlockData = await unlockAiReport({ participantId });
                hideTyping();

                if (unlockData.report) {
                    const aiReportHtml = formatReport(unlockData.report);
                    addBotMessage(aiReportHtml, true);
                    addLinkedInShareOption(unlockData.report);

                    appState.latestExportContext = createExportContext(unlockData.report, aiReportHtml);
                    saveAnalysisToHistory(userData.student_name, aiReportHtml, appState.latestExportContext);
                    await offerExportAndPrompt(appState.latestExportContext);
                } else {
                    addBotMessage('AI raporu su an gosterilemiyor.');
                }

                addBotMessage('Deney tamamlandi. Katkin icin tesekkurler!');
                appState.flowState = 'FINISHED';
                setInputState(false, 'Deney tamamlandi. Tesekkurler!');
                return;
            } catch (unlockError) {
                hideTyping();
                console.error(unlockError);
                addBotMessage('Surpriz AI raporu olusturulurken bir sorun oldu. Yine de deney basariyla tamamlandi.');
                appState.flowState = 'FINISHED';
                setInputState(false, 'Deney tamamlandi. Tesekkurler!');
                return;
            }
        }

        addBotMessage('Geri bildirimin icin tesekkurler! Deney tamamlandi.');
        appState.flowState = 'FINISHED';
        setInputState(false, 'Deney tamamlandi. Tesekkurler!');
    } catch (error) {
        hideTyping();
        console.error(error);
        addBotMessage('Geri bildirimi kaydederken bir sorun olustu. Lutfen tekrar dene.');
        appState.flowState = 'FEEDBACK';

        const ratingOptions = [1, 2, 3, 4, 5].map((value) => ({ label: `⭐ ${value}`, value }));
        addOptions(ratingOptions, handleOptionClick, true);
    }
}

async function handleOptionClick(value, label) {
    hideLatestOptionGroup();
    addUserMessage(label);

    if (appState.flowState === 'TESTING') {
        const questions = appState.currentTest === 'RIASEC' ? riasecQuestions : oceanQuestions;
        const currentQ = questions[appState.currentQuestionIndex];

        testAnswers.push({
            test: appState.currentTest,
            id: currentQ.id,
            type: currentQ.type,
            answer: value
        });

        appState.currentQuestionIndex += 1;
        showTyping();
        setTimeout(askNextQuestion, 560);
        return;
    }

    if (appState.flowState === 'FEEDBACK') {
        await submitFeedback(value);
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || appState.flowState !== 'ONBOARDING') return;

    addUserMessage(text);
    userInput.value = '';
    setInputState(false);
    showTyping();

    setTimeout(async () => {
        hideTyping();
        await processOnboardingStep(text);
        if (appState.flowState === 'ONBOARDING') {
            setInputState(true, 'Mesajini yaz...');
        }
    }, TYPING_DELAY);
}

async function processOnboardingStep(input) {
    switch (appState.currentStep) {
        case 0:
            userData.student_name = input;
            addBotMessage(`Memnun oldum ${input}. Hangi okulda okuyorsun?`);
            appState.currentStep += 1;
            break;
        case 1:
            userData.school = input;
            addBotMessage('Anladim. Peki hangi bolumde okuyorsun?');
            appState.currentStep += 1;
            break;
        case 2:
            userData.department = input;
            addBotMessage('Super. Son olarak, kariyer hedefin veya en buyuk hayalin nedir?');
            appState.currentStep += 1;
            break;
        case 3:
            userData.current_goal = input;
            addBotMessage('Harika! Bilgilerini kaydediyorum, lutfen bekle...');

            showTyping();
            try {
                const data = await startExperiment(userData);
                hideTyping();

                localStorage.setItem('participant_id', data.participantId);
                localStorage.setItem('experiment_group', data.group);

                addBotMessage('Kaydini basariyla aldim. Simdi teste geciyoruz.');
                setTimeout(startTestFlow, 900);
            } catch (error) {
                hideTyping();
                console.error(error);
                addBotMessage('Baglanti hatasi olustu. Lutfen internetini kontrol et ve tekrar dene.');
                setInputState(true, 'Mesajini yaz...');
            }
            break;
        default:
            break;
    }
}

async function startTestFlow() {
    appState.flowState = 'TEST_INTRO';
    setInputState(false, 'Test sirasinda butonlarla ilerleyin...');

    showTyping();
    setTimeout(async () => {
        hideTyping();
        addBotMessage('Kisa bir ilgi ve kisilik testi baslatiyorum. Hazirsan sorular geliyor.');

        try {
            const [riasecRes, oceanRes] = await Promise.all([
                fetch('data/riasec.json'),
                fetch('data/ocean.json')
            ]);

            const riasecData = await riasecRes.json();
            const oceanData = await oceanRes.json();

            riasecQuestions.length = 0;
            riasecQuestions.push(...riasecData);

            oceanQuestions.length = 0;
            oceanQuestions.push(...oceanData);

            appState.flowState = 'TESTING';
            appState.currentTest = 'RIASEC';
            appState.currentQuestionIndex = 0;
            showTyping();
            setTimeout(askNextQuestion, 820);
        } catch (error) {
            console.error(error);
            addBotMessage('Test sorulari yuklenemedi. Sayfayi yenileyip tekrar dener misin?');
        }
    }, 900);
}

function askNextQuestion() {
    hideTyping();

    const questions = appState.currentTest === 'RIASEC' ? riasecQuestions : oceanQuestions;
    if (appState.currentQuestionIndex < questions.length) {
        const q = questions[appState.currentQuestionIndex];
        const total = riasecQuestions.length + oceanQuestions.length;
        let stepNo = appState.currentQuestionIndex + 1;

        if (appState.currentTest === 'OCEAN') {
            stepNo += riasecQuestions.length;
        }

        addBotMessage(`Soru ${stepNo}/${total}: ${q.text}`);
        addOptions(
            [
                { label: 'Evet, katiliyorum', value: true },
                { label: 'Hayir, katilmiyorum', value: false }
            ],
            handleOptionClick
        );
        return;
    }

    if (appState.currentTest === 'RIASEC') {
        appState.currentTest = 'OCEAN';
        appState.currentQuestionIndex = 0;
        addBotMessage('Harika. Simdi kisilik envanteri bolumune geciyoruz.');
        showTyping();
        setTimeout(askNextQuestion, 900);
        return;
    }

    appState.flowState = 'FINISHED';
    addBotMessage('Tum testi tamamladin. Cevaplarini analiz ediyorum...');
    submitTestResults();
}

async function submitTestResults() {
    showTyping();
    const participantId = localStorage.getItem('participant_id');

    if (!participantId) {
        hideTyping();
        addBotMessage('Bir sorun olustu: katilimci kimligi bulunamadi.');
        return;
    }

    try {
        const data = await submitTestResultsApi({ participantId, testAnswers });
        hideTyping();

        addBotMessage('Harika! Sonuclarin hazir.');

        const experimentGroup = localStorage.getItem('experiment_group');

        if (data.report) {
            const reportHtml = formatReport(data.report);
            addBotMessage(reportHtml, true);
            addLinkedInShareOption(data.report);

            appState.latestExportContext = createExportContext(data.report, reportHtml);
            saveAnalysisToHistory(userData.student_name, reportHtml, appState.latestExportContext);

            if (experimentGroup === 'B') {
                await offerExportAndPrompt(appState.latestExportContext);
            }
        } else {
            addBotMessage('Rapor su an goruntulenemiyor, ancak anketi tamamlayabilirsin.');
        }

        setTimeout(askSatisfactionSurvey, 600);
    } catch (error) {
        hideTyping();
        console.error(error);
        addBotMessage('Baglanti hatasi olustu. Lutfen tekrar dene.');
    }
}
