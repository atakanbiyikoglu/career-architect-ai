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
    addActionOptions,
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

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    setupModalHandlers();
    registerServiceWorker();

    const toggleBtn = document.getElementById('menu-toggle');
    const appWrapper = document.querySelector('.app-wrapper') || document.body;
    const sidebar = document.querySelector('.sidebar') || document.querySelector('.left-panel');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                } else {
                    sidebar.classList.add('active');
                }
                return;
            }

            if (appWrapper.classList.contains('sidebar-collapsed')) {
                appWrapper.classList.remove('sidebar-collapsed');
            } else {
                appWrapper.classList.add('sidebar-collapsed');
            }
        });

        document.addEventListener('click', (e) => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    showTyping();
    setTimeout(() => {
        hideTyping();
        addBotMessage('Merhaba! Ben Kariyer Mimari AI. TÜBİTAK 2209-A kapsamında geliştirilen bu platform, ilgi ve kişilik testlerini yapay zeka ile sentezleyerek sana en uygun bilişim kariyerini çizer. (Teste başlayarak akademik aydınlatma metnini onaylamış sayılırsın).');

        setTimeout(() => {
            addBotMessage('Başlamadan önce seni tanıyalım, adın nedir?');
                setInputState(true, 'Mesajını yaz...');
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
    addBotMessage(analysis.report || '<p>Rapor bulunamadı.</p>', true);

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
    const shareText = `Kariyer Mimari AI ile psikometrik analizimi tamamladım. Özet: ${summary}`;
    const hashtags = '#kariyer #yapayzeka #riasec #ocean #tubitak2209a';
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${shareText}\n${hashtags}`)}`;

    addBotMessage(
        `Sonucunu LinkedInde paylaşmak istersen: <a href="${linkedInUrl}" target="_blank" rel="noopener noreferrer">LinkedIn'de Paylaş</a>`,
        true
    );
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch((err) => {
                console.error('Service worker kaydı başarısız:', err);
            });
        });
    }
}

function askSatisfactionSurvey() {
    appState.flowState = 'FEEDBACK';
    showTyping();

    setTimeout(() => {
        hideTyping();

        const surveyMessage = 'Deneyiminizi puanlayarak profesyonel analiz raporunuzu PDF formatında hemen indirebilirsiniz! 📊 Lütfen 1\'den 5\'e kadar bir puan veriniz:';
        
        addBotMessage(surveyMessage);

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
        addBotMessage('Geri bildirim kaydedilemedi: katılımcı kimliği bulunamadı.');
        appState.flowState = 'FINISHED';
        setInputState(false, 'Deney tamamlandı.');
        return;
    }

    showTyping();
    try {
        await submitFeedbackApi({ participantId, satisfaction_score: score });
        hideTyping();

        addBotMessage(`Teşekkürler! ${score}/5 puanını kaydettim. Şimdi PDF raporunu ve yapay zeka mentörlüğü için özel komutunu hazırlıyorum...`);

        // Check if we have export context
        if (appState.latestExportContext && hasValidScores(appState.latestExportContext)) {
            setTimeout(() => {
                offerExportAndPrompt(appState.latestExportContext).then(() => {
                    addBotMessage('🎉 Deney tamamlandı. Katılımın için çok teşekkür ederiz!');
                    appState.flowState = 'FINISHED';
                    setInputState(false, 'Deney tamamlandı. Teşekkürler!');
                });
            }, 800);
        } else {
            addBotMessage('PDF ve komut hazırlanırken bir sorun oluştu, ancak deney tamamlandı.');
            appState.flowState = 'FINISHED';
            setInputState(false, 'Deney tamamlandı. Teşekkürler!');
        }
    } catch (error) {
        hideTyping();
        console.error(error);
        addBotMessage('Puanı kaydederken bir sorun oldu. Lütfen sayfayı yenile ve tekrar dene.');
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

    if (appState.flowState === 'AI_OPTIONAL') {
        // This will be handled by askGroupAAboutAI's callback
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
                setInputState(true, 'Mesajını yaz...');
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
            addBotMessage('Anladım. Peki hangi bölümde okuyorsun?');
            appState.currentStep += 1;
            break;
        case 2:
            userData.department = input;
            addBotMessage('Süper. Son olarak, kariyer hedefin veya en büyük hayalin nedir?');
            appState.currentStep += 1;
            break;
        case 3:
            userData.current_goal = input;
            addBotMessage('Harika! Bilgilerini kaydediyorum, lütfen bekle...');

            showTyping();
            try {
                const data = await startExperiment(userData);
                hideTyping();

                localStorage.setItem('participant_id', data.participantId);
                localStorage.setItem('experiment_group', data.group);

                addBotMessage('Kaydını başarıyla aldım. Şimdi teste geçiyoruz.');
                setTimeout(startTestFlow, 900);
            } catch (error) {
                hideTyping();
                console.error(error);
                addBotMessage('Bağlantı hatası oldu. Lütfen internetini kontrol et ve tekrar dene.');
                setInputState(true, 'Mesajını yaz...');
            }
            break;
        default:
            break;
    }
}

async function startTestFlow() {
    appState.flowState = 'TEST_INTRO';
    setInputState(false, 'Test sırasında butonlarla ilerleyin...');

    showTyping();
    setTimeout(async () => {
        hideTyping();
        addBotMessage('Kısa bir ilgi ve kişilik testi başlatıyorum. Hazırsan sorular geliyor.');

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
            addBotMessage('Test soruları yüklenemedi. Sayfayı yenileyip tekrar dener misin?');
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
                { label: 'Evet, katılıyorum', value: true },
                { label: 'Hayır, katılmıyorum', value: false }
            ],
            handleOptionClick
        );
        return;
    }

    if (appState.currentTest === 'RIASEC') {
        appState.currentTest = 'OCEAN';
        appState.currentQuestionIndex = 0;
        addBotMessage('Harika. Şimdi kişilik envanteri bölümüne geçiyoruz.');
        showTyping();
        setTimeout(askNextQuestion, 900);
        return;
    }

    appState.flowState = 'FINISHED';
    addBotMessage('Tüm testi tamamladın. Cevaplarını analiz ediyorum...');
    submitTestResults();
}

async function submitTestResults() {
    showTyping();
    const participantId = localStorage.getItem('participant_id');

    if (!participantId) {
        hideTyping();
        addBotMessage('Bir sorun oldu: katılımcı kimliği bulunamadı.');
        return;
    }

    try {
        const data = await submitTestResultsApi({ participantId, testAnswers });
        hideTyping();

        addBotMessage('Harika! Sonuçların hazır.');

        const experimentGroup = localStorage.getItem('experiment_group');

        if (data && data.report) {
            const reportHtml = formatReport(data.report);
            addBotMessage(reportHtml, true);
            addLinkedInShareOption(data.report);

            appState.latestExportContext = createExportContext(data.report, reportHtml);
            saveAnalysisToHistory(userData.student_name, reportHtml, appState.latestExportContext);

            // For Group A: Ask if they want to see AI analysis
            if (experimentGroup === 'A' && data.isGroupA) {
                setTimeout(() => askGroupAAboutAI(), 800);
                return;
            }

            // For Group B: Skip to satisfaction survey (export will come after rating)
            setTimeout(askSatisfactionSurvey, 800);
        } else {
            addBotMessage('Rapor şu an görüntülenemiyor, ancak anketi tamamlayabilirsin.');
            setTimeout(askSatisfactionSurvey, 800);
        }
    } catch (err) {
        hideTyping();
        console.error(err);
        addBotMessage('Bağlantı hatası oldu. Lütfen tekrar dene.');
    }
}

async function askGroupAAboutAI() {
    appState.flowState = 'AI_OPTIONAL';
    addBotMessage('Şu an YZ kullanılmayan gruptasınız. Kariyer Mimarı AI\'ın sizin verilerinizi sentezleyerek hazırladığı özel analizi de görmek ister misiniz?');

    addActionOptions(
        [
            { label: 'Evet, YZ Analizini Gör ✨', value: 'yes' },
            { label: 'Hayır, Testi Bitir', value: 'no' }
        ],
        async (choice) => {
            if (choice === 'yes') {
                appState.flowState = 'FEEDBACK';
                await unlockAIAnalysisForGroupA();
            } else {
                addBotMessage('Anlıyoruz, temel analiziniz tamamlandı.');
                appState.flowState = 'FEEDBACK';
                setTimeout(askSatisfactionSurvey, 600);
            }
        }
    );
}

async function unlockAIAnalysisForGroupA() {
    const participantId = localStorage.getItem('participant_id');
    showTyping();

    try {
        const data = await unlockAiReport({ participantId });
        hideTyping();

        if (data && data.report) {
            addBotMessage('İşte Yapay Zeka tarafından üretilen özel analiz:');
            const reportHtml = formatReport(data.report);
            addBotMessage(reportHtml, true);
            addLinkedInShareOption(data.report);
        } else {
            addBotMessage('YZ analizi şu an oluşturulamadı.');
        }

        setTimeout(askSatisfactionSurvey, 800);
    } catch (err) {
        hideTyping();
        console.error(err);
        addBotMessage('Yapay zeka analizini yüklerken bir hata oluştu. Lütfen tekrar dene.');
        setTimeout(askSatisfactionSurvey, 800);
    }
}
