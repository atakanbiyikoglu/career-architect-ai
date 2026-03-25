let currentStep = 0;
let flowState = 'ONBOARDING'; // ONBOARDING | TEST_INTRO | TESTING | FEEDBACK | FINISHED

const userData = {
    student_name: '',
    school: '',
    department: '',
    current_goal: ''
};

let riasecQuestions = [];
let oceanQuestions = [];
let currentTest = 'RIASEC';
let currentQuestionIndex = 0;
const testAnswers = [];
let latestExportContext = null;

const RIASEC_TYPE_MAP = {
    Realistic: 'R',
    Investigative: 'I',
    Artistic: 'A',
    Social: 'S',
    Enterprising: 'E',
    Conventional: 'C'
};

const OCEAN_TYPE_MAP = {
    Openness: 'Openness',
    Conscientiousness: 'Conscientiousness',
    Extraversion: 'Extraversion',
    Agreeableness: 'Agreeableness',
    Neuroticism: 'Neuroticism'
};

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const typingIndicator = document.getElementById('typing-indicator');
const submitBtn = chatForm.querySelector('button');
const newAnalysisBtn = document.getElementById('new-analysis-btn');

const API_ENDPOINT = '/api/start-experiment';
const TYPING_DELAY = 850;

document.addEventListener('DOMContentLoaded', () => {
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }

    setupModalHandlers();

    showTyping();
    setTimeout(() => {
        hideTyping();
        addBotMessage('Merhaba! Ben Kariyer Mimarı AI. 🚀 TÜBİTAK 2209-A kapsamında geliştirilen bu platform, İlgi ve Kişilik testlerini yapay zeka ile sentezleyerek sana en uygun Bilişim kariyerini çizer. (Teste başlayarak akademik aydınlatma metnini onaylamış sayılırsın).');
        
        setTimeout(() => {
            addBotMessage('Başlamadan önce seni tanıyalım, adın nedir?');
            setInputState(true, 'Mesajını yaz...');
        }, 500);
    }, TYPING_DELAY);
});

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

    modalCloses.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });

    modalOverlays.forEach(overlay => {
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
    
    // Reverse to show newest first
    analyses.slice().reverse().forEach((analysis, idx) => {
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
        pdfBtn.textContent = 'Onizle & PDF';
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

function normalizeHistoricExportContext(analysis) {
    if (analysis && analysis.exportContext) {
        return {
            profile: {
                student_name: analysis.exportContext.profile?.student_name || analysis.name || '-',
                school: analysis.exportContext.profile?.school || '-',
                department: analysis.exportContext.profile?.department || '-',
                current_goal: analysis.exportContext.profile?.current_goal || '-'
            },
            scores: {
                riasec: analysis.exportContext.scores?.riasec || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
                ocean: analysis.exportContext.scores?.ocean || {
                    Openness: 0,
                    Conscientiousness: 0,
                    Extraversion: 0,
                    Agreeableness: 0,
                    Neuroticism: 0
                }
            },
            reportText: analysis.exportContext.reportText || stripHtml(analysis.report || ''),
            reportHtml: analysis.exportContext.reportHtml || analysis.report || '<p>-</p>'
        };
    }

    return {
        profile: {
            student_name: analysis?.name || '-',
            school: '-',
            department: '-',
            current_goal: '-'
        },
        scores: {
            riasec: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
            ocean: {
                Openness: 0,
                Conscientiousness: 0,
                Extraversion: 0,
                Agreeableness: 0,
                Neuroticism: 0
            }
        },
        reportText: stripHtml(analysis?.report || ''),
        reportHtml: analysis?.report || '<p>-</p>'
    };
}

async function previewHistoricAnalysisForExport(analysis) {
    chatMessages.innerHTML = '';
    addBotMessage('Sizin önceki analiziniz burada. İndirmek ve yapay zeka ile mentorlüğe devam etmek ister misiniz?');
    addBotMessage(analysis.report || '<p>Rapor bulunamadı.</p>', true);

    latestExportContext = normalizeHistoricExportContext(analysis);
    
    // Check if export context has valid scores
    if (!latestExportContext || !hasValidScores(latestExportContext)) {
        addBotMessage('❌ Maalesef bu analiz için detaylı export desteklenmiyor. Ana sayfaya dönüp yeni bir test çözmek ister misin?');
        return;
    }
    
    await offerExportAndPrompt(latestExportContext);
}

function saveAnalysisToHistory(name, reportHtml, exportContext = null) {
    const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    analyses.push({
        name: name,
        date: dateStr,
        report: reportHtml,
        timestamp: now.getTime(),
        exportContext: exportContext
    });
    
    localStorage.setItem('analyses', JSON.stringify(analyses));
    loadAnalysisHistory();
}

function displayHistoricAnalysis(index) {
    const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
    if (analyses[index]) {
        chatMessages.innerHTML = '';
        const analysis = analyses[index];
        addBotMessage(analysis.report, true);
    }
}

function downloadReportAsPdf(reportHtml) {
    const element = document.createElement('div');
    element.innerHTML = reportHtml;
    element.style.padding = '24px';
    element.style.fontFamily = "'IBM Plex Sans', Arial, sans-serif";
    element.style.lineHeight = '1.6';
    element.style.color = '#333';
    
    const opt = {
        margin: [12, 12, 12, 12],
        filename: 'kariyer-raporu-' + new Date().toISOString().slice(0, 10) + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(htmlText) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText || '';
    return temp.textContent || temp.innerText || '';
}

function calculateScoresFromAnswers(answers) {
    const riasec = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const ocean = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };

    (answers || []).forEach((ans) => {
        if (ans.answer !== true) return;

        const rKey = RIASEC_TYPE_MAP[ans.type];
        const oKey = OCEAN_TYPE_MAP[ans.type];

        if (rKey) riasec[rKey] += 1;
        if (oKey) ocean[oKey] += 1;
    });

    return { riasec, ocean };
}

function formatScoreSummary(scores) {
    const riasec = Object.entries(scores.riasec)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    const ocean = Object.entries(scores.ocean)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    return { riasec, ocean };
}

function createExportContext(reportText, reportHtml) {
    const scores = calculateScoresFromAnswers(testAnswers);
    return {
        profile: {
            student_name: userData.student_name || '-',
            school: userData.school || '-',
            department: userData.department || '-',
            current_goal: userData.current_goal || '-'
        },
        scores,
        reportText: reportText || '',
        reportHtml: reportHtml || '<p>-</p>'
    };
}

function renderScoreList(listElement, scoreEntries) {
    listElement.innerHTML = '';
    scoreEntries.forEach(([key, value]) => {
        const li = document.createElement('li');
        li.textContent = `${key}: ${value}`;
        listElement.appendChild(li);
    });
}

function fillPdfTemplate(container, context) {
    container.querySelector('#pdf-user-name').textContent = context.profile.student_name;
    container.querySelector('#pdf-user-school').textContent = context.profile.school;
    container.querySelector('#pdf-user-department').textContent = context.profile.department;
    container.querySelector('#pdf-user-goal').textContent = context.profile.current_goal;

    renderScoreList(container.querySelector('#pdf-riasec-scores'), Object.entries(context.scores.riasec));
    renderScoreList(container.querySelector('#pdf-ocean-scores'), Object.entries(context.scores.ocean));

    container.querySelector('#pdf-report-content').innerHTML = context.reportHtml;
}

async function downloadStyledExportPdf(context) {
    const template = document.getElementById('pdf-export-template');
    if (!template) {
        downloadReportAsPdf(context.reportHtml || '');
        return;
    }

    fillPdfTemplate(template, context);

    const runtime = template.cloneNode(true);
    runtime.id = 'pdf-export-runtime';
    runtime.classList.remove('pdf-export-template-hidden');
    runtime.style.display = 'block';
    runtime.style.position = 'fixed';
    runtime.style.left = '-100000px';
    runtime.style.top = '0';
    runtime.style.zIndex = '-1';
    runtime.setAttribute('aria-hidden', 'true');
    document.body.appendChild(runtime);

    const runtimeContext = {
        ...context,
        profile: { ...context.profile },
        scores: {
            riasec: { ...context.scores.riasec },
            ocean: { ...context.scores.ocean }
        }
    };

    fillPdfTemplate(runtime, runtimeContext);

    const paper = runtime.querySelector('.pdf-paper');
    const opt = {
        margin: [0, 0, 0, 0],
        filename: `kariyer-raporu-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    try {
        await html2pdf().set(opt).from(paper).save();
    } finally {
        runtime.remove();
    }
}

function buildFollowupPrompt(context) {
    const scoreSummary = formatScoreSummary(context.scores);
    return `Merhaba. Ben ${context.profile.student_name}, ${context.profile.department} okuyorum ve hedefim ${context.profile.current_goal}. TÜBİTAK destekli Kariyer Mimarı AI platformunda bir test çözdüm. İlgi alanı (RIASEC) skorlarım: ${scoreSummary.riasec}. Kişilik (OCEAN) skorlarım: ${scoreSummary.ocean}. Platform bana şu analizi ve niş bilişim rollerini önerdi:\n\n${context.reportText}\n\nLütfen benim profesyonel kariyer koçum ol. Bu veriler ışığında bana detaylı bir öğrenme yol haritası çıkar, hangi projeleri yapmam gerektiğini söyle ve benimle mülakat pratiği yap.`;
}

function addActionOptions(options, onChoose) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-row';
    wrapper.dataset.optionGroup = 'true';

    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
            wrapper.classList.add('hidden');
            addUserMessage(opt.label);
            onChoose(opt.value);
        });
        wrapper.appendChild(btn);
    });

    chatMessages.insertBefore(wrapper, typingIndicator);
    setInputState(false, 'Lutfen seceneklerden birini sec...');
    scrollToBottom();
}

function offerExportAndPrompt(context) {
    return new Promise((resolve) => {
        // Validate context before offering export
        if (!context || !hasValidScores(context)) {
            addBotMessage('❌ Detaylı analiz için test verilerine ihtiyaç var. Lütfen test sonuçlarını kontrol et.');
            resolve('error');
            return;
        }

        addBotMessage("Bu platformda uzun soluklu sohbetler edemiyoruz. Ancak bu analiz raporunu şık bir PDF olarak indirmek ve ChatGPT/Gemini gibi yapay zeka ile mentörlüğe devam etmeni sağlayacak özel bir komut (prompt) ister misin?");

        addActionOptions(
            [
                { label: 'Evet, PDF ve Komutu Ver ✨', value: 'yes' },
                { label: 'Hayır, Teşekkürler', value: 'no' }
            ],
            async (choice) => {
                if (choice === 'yes') {
                    const pdfPromise = downloadStyledExportPdf(context);
                    const promptText = buildFollowupPrompt(context);
                    addBotMessage('Harika! 🔥 PDF raporun indiriliyor. Aşağıdaki komutu (prompt) kopyalayabilirsin:');
                    addBotMessage(`<div class="prompt-copy-wrapper"><div class="prompt-copy-text" id="prompt-text-${Date.now()}">${escapeHtml(promptText)}</div><button class="prompt-copy-btn" data-prompt-id="prompt-text-${Date.now()}">📋 Kopyala</button></div>`, true);
                    
                    // Attach copy button listeners
                    setTimeout(() => {
                        document.querySelectorAll('.prompt-copy-btn').forEach(btn => {
                            if (!btn.dataset.listenerAttached) {
                                btn.addEventListener('click', handlePromptCopy);
                                btn.dataset.listenerAttached = 'true';
                            }
                        });
                    }, 100);
                    
                    await pdfPromise;
                    addBotMessage('✅ Tamamlandı! ChatGPT veya Gemini\'ye kopyaladığın komutu yapıştırarak kariyer mentörlüğüne devam edebilirsin.');
                } else {
                    addBotMessage('Tamam, bu adımı atlıyoruz.');
                }

                resolve(choice);
            }
        );
    });
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setInputState(enabled, placeholder) {
    userInput.disabled = !enabled;
    submitBtn.disabled = !enabled;
    if (placeholder) userInput.placeholder = placeholder;
    if (enabled) userInput.focus();
}

function showTyping() {
    typingIndicator.classList.remove('hidden');
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.classList.add('hidden');
}

function hasValidScores(context) {
    if (!context || !context.scores) return false;
    
    const riasec = context.scores.riasec || {};
    const ocean = context.scores.ocean || {};
    
    const riasecSum = Object.values(riasec).reduce((a, b) => a + b, 0);
    const oceanSum = Object.values(ocean).reduce((a, b) => a + b, 0);
    
    return riasecSum > 0 && oceanSum > 0;
}

function handlePromptCopy(e) {
    const btn = e.target;
    const promptId = btn.dataset.promptId;
    const promptElement = document.getElementById(promptId);
    
    if (!promptElement) return;
    
    const text = promptElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.textContent;
        btn.textContent = '✅ Kopyalandı!';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.textContent = oldText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Kopyala islemi basarisiz:', err);
        alert('Kopyalama başarısız oldu. Lütfen manuel olarak kopyala.');
    });
}

function createMessageRow(role, contentNode) {
    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    if (role === 'ai') {
        const avatar = document.createElement('img');
        avatar.src = 'assets/logo.png';
        avatar.alt = 'AI Logo';
        avatar.className = 'ai-avatar';
        row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.appendChild(contentNode);
    row.appendChild(bubble);

    chatMessages.insertBefore(row, typingIndicator);
    scrollToBottom();
}

function addBotMessage(text, asHtml = false) {
    const content = document.createElement('div');
    if (asHtml) {
        content.className = 'markdown-block';
        content.innerHTML = text;
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        content.appendChild(p);
    }
    createMessageRow('ai', content);
}

function addUserMessage(text) {
    const content = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);
    createMessageRow('user', content);
}

function addOptions(options, isRating = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-row';
    wrapper.dataset.optionGroup = 'true';

    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `choice-btn${isRating ? ' rating-btn' : ''}`;
        btn.textContent = opt.label;
        btn.addEventListener('click', () => handleOptionClick(opt.value, opt.label));
        wrapper.appendChild(btn);
    });

    chatMessages.insertBefore(wrapper, typingIndicator);
    setInputState(false, 'Lütfen seçeneklerden birini seç...');
    scrollToBottom();
}

function hideLatestOptionGroup() {
    const groups = chatMessages.querySelectorAll('[data-option-group="true"]');
    if (!groups.length) return;
    const latest = groups[groups.length - 1];
    latest.classList.add('hidden');
}

function askSatisfactionSurvey() {
    flowState = 'FEEDBACK';
    showTyping();
    setTimeout(() => {
        hideTyping();
        addBotMessage('Bu kariyer analizi senin için ne kadar faydalı ve detaylıydı? Lütfen 1 ile 5 arasında puan ver.');

        const ratingOptions = [1, 2, 3, 4, 5].map((score) => ({
            label: `⭐ ${score}`,
            value: score
        }));
        addOptions(ratingOptions, true);
    }, 700);
}

async function submitFeedback(score) {
    const participantId = localStorage.getItem('participant_id');
    if (!participantId) {
        addBotMessage('Geri bildirim kaydedilemedi: katılımcı kimliği bulunamadı.');
        flowState = 'FINISHED';
        setInputState(false, 'Deney tamamlandı.');
        return;
    }

    showTyping();
    try {
        const response = await fetch('/api/submit-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId, satisfaction_score: score })
        });
        hideTyping();

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Geri bildirim kaydedilemedi.');
        }

        const experimentGroup = localStorage.getItem('experiment_group');

        if (experimentGroup === 'A') {
            addBotMessage('Geri bildirini için teşekkürler! Az önce okuduğun, standart kural tabanlı bir algoritmanın (Kontrol Grubu) analiziydi. Deneyimize katkın için bir hediye olarak, şimdi verilerini Gerçek Yapay Zeka (Gemini) modelimize gönderiyorum. Sıkı dur, işte senin gerçek Siber-Kariyer Mimarı analizin...');

            showTyping();
            addBotMessage('Yapay Zeka Analiz Ediyor... 🤖');

            try {
                const unlockRes = await fetch('/api/unlock-ai-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participantId })
                });

                hideTyping();

                if (!unlockRes.ok) {
                    const unlockErr = await unlockRes.json().catch(() => ({}));
                    throw new Error(unlockErr.error || 'AI raporu oluşturulamadı.');
                }

                const unlockData = await unlockRes.json();
                if (unlockData.report) {
                    const aiReportHtml = formatReport(unlockData.report);
                    addBotMessage(aiReportHtml, true);

                    latestExportContext = createExportContext(unlockData.report, aiReportHtml);
                    saveAnalysisToHistory(userData.student_name, aiReportHtml, latestExportContext);
                    await offerExportAndPrompt(latestExportContext);
                } else {
                    addBotMessage('AI raporu şu an gösterilemiyör.');
                }

                addBotMessage('✅ Deney tamamlandı. Katkın için teşekkürler!');
                flowState = 'FINISHED';
                setInputState(false, 'Deney tamamlandı. Teşekkürler!');
                return;
            } catch (unlockError) {
                hideTyping();
                console.error(unlockError);
                addBotMessage('⚠️ Sürpriz AI raporu oluşturulurken bir sorun oldu. Yine de deney başarıyla tamamlandı, teşekkürler!');
                flowState = 'FINISHED';
                setInputState(false, 'Deney tamamlandı. Teşekkürler!');
                return;
            }
        }

        addBotMessage('Geri bildirini için teşekkürler! Deney tamamlandı. 🎉');
        flowState = 'FINISHED';
        setInputState(false, 'Deney tamamlandı. Teşekkürler!');
    } catch (error) {
        hideTyping();
        console.error(error);
        addBotMessage('Geri bildirimi kaydederken bir sorun oluştu. Lütfen tekrar dene.');
        flowState = 'FEEDBACK';
        const ratingOptions = [1, 2, 3, 4, 5].map((score) => ({ label: `⭐ ${score}`, value: score }));
        addOptions(ratingOptions, true);
    }
}

async function handleOptionClick(value, label) {
    hideLatestOptionGroup();
    addUserMessage(label);

    if (flowState === 'TESTING') {
        const questions = currentTest === 'RIASEC' ? riasecQuestions : oceanQuestions;
        const currentQ = questions[currentQuestionIndex];

        testAnswers.push({
            test: currentTest,
            id: currentQ.id,
            type: currentQ.type,
            answer: value
        });

        currentQuestionIndex++;
        showTyping();
        setTimeout(askNextQuestion, 560);
        return;
    }

    if (flowState === 'FEEDBACK') {
        await submitFeedback(value);
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || flowState !== 'ONBOARDING') return;

    addUserMessage(text);
    userInput.value = '';
    setInputState(false);
    showTyping();

    setTimeout(async () => {
        hideTyping();
        await processOnboardingStep(text);
        if (flowState === 'ONBOARDING') {
            setInputState(true, 'Mesajını yaz...');
        }
    }, TYPING_DELAY);
}

async function processOnboardingStep(input) {
    switch (currentStep) {
        case 0:
            userData.student_name = input;
            addBotMessage(`Memnun oldum ${input}. 🎓 Hangi okulda okuyorsun?`);
            currentStep++;
            break;
        case 1:
            userData.school = input;
            addBotMessage('Anladım. Peki hangi bölümde okuyorsun?');
            currentStep++;
            break;
        case 2:
            userData.department = input;
            addBotMessage('Süper. Son olarak, kariyer hedefin veya en büyük hayalin nedir?');
            currentStep++;
            break;
        case 3:
            userData.current_goal = input;
            addBotMessage('Harika! Bilgilerini kaydediyorum, lütfen bekle...');

            showTyping();
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                hideTyping();

                if (!response.ok) {
                    addBotMessage('Üzgünüm, kaydederken bir sorun oluştu. Tekrar dener misin?');
                    setInputState(true, 'Mesajını yaz...');
                    return;
                }

                const data = await response.json();
                localStorage.setItem('participant_id', data.participantId);
                localStorage.setItem('experiment_group', data.group);

                addBotMessage('Kaydını başarıyla aldım. ✅ Şimdi teste geçiyoruz.');
                setTimeout(startTestFlow, 900);
            } catch (error) {
                hideTyping();
                console.error(error);
                addBotMessage('Bağlantı hatası oluştu. Lütfen internetini kontrol et ve tekrar dene.');
                setInputState(true, 'Mesajını yaz...');
            }
            break;
        default:
            break;
    }
}

async function startTestFlow() {
    flowState = 'TEST_INTRO';
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

            riasecQuestions = await riasecRes.json();
            oceanQuestions = await oceanRes.json();

            flowState = 'TESTING';
            currentTest = 'RIASEC';
            currentQuestionIndex = 0;
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

    const questions = currentTest === 'RIASEC' ? riasecQuestions : oceanQuestions;
    if (currentQuestionIndex < questions.length) {
        const q = questions[currentQuestionIndex];
        const total = riasecQuestions.length + oceanQuestions.length;
        let stepNo = currentQuestionIndex + 1;
        if (currentTest === 'OCEAN') stepNo += riasecQuestions.length;

        addBotMessage(`Soru ${stepNo}/${total}: ${q.text}`);
        addOptions([
            { label: 'Evet, katılıyorum', value: true },
            { label: 'Hayır, katılmıyorum', value: false }
        ]);
        return;
    }

    if (currentTest === 'RIASEC') {
        currentTest = 'OCEAN';
        currentQuestionIndex = 0;
        addBotMessage('Harika. Şimdi kişilik envanteri bölümüne geçiyoruz.');
        showTyping();
        setTimeout(askNextQuestion, 900);
        return;
    }

    flowState = 'FINISHED';
    addBotMessage('Tüm testi tamamladın. 🎉 Cevaplarını analiz ediyorum...');
    submitTestResults();
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

async function submitTestResults() {
    showTyping();
    const participantId = localStorage.getItem('participant_id');

    if (!participantId) {
        hideTyping();
        addBotMessage('Bir sorun oluştu: katılımcı kimliği bulunamadı.');
        return;
    }

    try {
        const response = await fetch('/api/submit-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId, testAnswers })
        });

        hideTyping();

        if (!response.ok) {
            addBotMessage('Sonuçları kaydederken bir hata oluştu. Lütfen tekrar dene.');
            return;
        }

        const data = await response.json();
        addBotMessage('Harika! Sonuçların hazır.');

        const experimentGroup = localStorage.getItem('experiment_group');

        if (data.report) {
            const reportHtml = formatReport(data.report);
            addBotMessage(reportHtml, true);

            latestExportContext = createExportContext(data.report, reportHtml);
            saveAnalysisToHistory(userData.student_name, reportHtml, latestExportContext);

            if (experimentGroup === 'B') {
                await offerExportAndPrompt(latestExportContext);
            }
        } else {
            addBotMessage('Rapor şu an görüntülenemiyor, ancak anketi tamamlayabilirsin.');
        }

        setTimeout(askSatisfactionSurvey, 600);
    } catch (error) {
        hideTyping();
        console.error(error);
        addBotMessage('Bağlantı hatası oluştu. Lütfen tekrar dene.');
    }
}
