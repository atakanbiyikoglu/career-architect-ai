import {
    appState,
    userData,
    testAnswers,
    RIASEC_TYPE_MAP,
    OCEAN_TYPE_MAP
} from './state.js';
import {
    addActionOptions,
    addBotMessage
} from './ui.js';

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

function formatScoreSummary(scores) {
    const riasec = Object.entries(scores.riasec)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    const ocean = Object.entries(scores.ocean)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

    return { riasec, ocean };
}

function calculateScoresFromAnswers(answers) {
    const riasec = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const ocean = {
        Openness: 0,
        Conscientiousness: 0,
        Extraversion: 0,
        Agreeableness: 0,
        Neuroticism: 0
    };

    (answers || []).forEach((ans) => {
        if (ans.answer !== true) return;

        const rKey = RIASEC_TYPE_MAP[ans.type];
        const oKey = OCEAN_TYPE_MAP[ans.type];

        if (rKey) riasec[rKey] += 1;
        if (oKey) ocean[oKey] += 1;
    });

    return { riasec, ocean };
}

export function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function stripHtml(htmlText) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlText || '';
    return temp.textContent || temp.innerText || '';
}

export function hasValidScores(context) {
    if (!context || !context.scores) return false;

    const riasec = context.scores.riasec || {};
    const ocean = context.scores.ocean || {};

    const riasecSum = Object.values(riasec).reduce((a, b) => a + b, 0);
    const oceanSum = Object.values(ocean).reduce((a, b) => a + b, 0);

    return riasecSum > 0 && oceanSum > 0;
}

export function createExportContext(reportText, reportHtml) {
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

export function normalizeHistoricExportContext(analysis) {
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

function downloadReportAsPdf(reportHtml) {
    const element = document.createElement('div');
    element.innerHTML = reportHtml;
    element.style.padding = '24px';
    element.style.fontFamily = "'IBM Plex Sans', Arial, sans-serif";
    element.style.lineHeight = '1.6';
    element.style.color = '#333';

    const opt = {
        margin: [12, 12, 12, 12],
        filename: `kariyer-raporu-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
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
    return `Merhaba. Ben ${context.profile.student_name}, ${context.profile.department} okuyorum ve hedefim ${context.profile.current_goal}. TÜBİTAK destekli Kariyer Mimari AI platformunda bir test çözdüm. İlgi alanı (RIASEC) skorlarım: ${scoreSummary.riasec}. Kişilik (OCEAN) skorlarım: ${scoreSummary.ocean}. Platform bana şu analizi ve niş bilişim rollerini önerdi:\n\n${context.reportText}\n\nLütfen benim profesyonel kariyer koçum ol. Bu veriler ışığında bana detaylı bir öğrenme yol haritası çıkar, hangi projeleri yapmam gerektiğini söyle ve benimle mülakat pratiği yap.`;
}

function handlePromptCopy(e) {
    const btn = e.target;
    const promptId = btn.dataset.promptId;
    const promptElement = document.getElementById(promptId);

    if (!promptElement) return;

    const text = promptElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const oldText = btn.textContent;
        btn.textContent = 'Kopyalandı';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = oldText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch((err) => {
        console.error('Kopyala işlemi başarısız:', err);
        alert('Kopyalama başarısız oldu. Lütfen manuel olarak kopyala.');
    });
}

export function offerExportAndPrompt(context) {
    return new Promise((resolve) => {
        if (!context || !hasValidScores(context)) {
            addBotMessage('❌ Detaylı analiz için test verilerine ihtiyaç var. Lütfen test sonuçlarını kontrol et.');
            resolve('error');
            return;
        }

        addBotMessage('Bu platformda uzun soluklu sohbetler edemiyoruz. Ancak bu analiz raporunu şık bir PDF olarak indirmek ve ChatGPT/Gemini gibi yapay zeka ile mentörlüğe devam etmeni sağlayacak özel bir komut (prompt) ister misin?');

        addActionOptions(
            [
                { label: 'Evet, PDF ve Komutu Ver ✨', value: 'yes' },
                { label: 'Hayır, Teşekkürler', value: 'no' }
            ],
            async (choice) => {
                if (choice === 'yes') {
                    const pdfPromise = downloadStyledExportPdf(context);
                    const promptText = buildFollowupPrompt(context);
                    const promptId = `prompt-text-${Date.now()}`;

                    addBotMessage('Harika! 🔥 PDF raporun indiriliyor. Aşağıdaki komutu (prompt) kopyalayabilirsin:');
                    addBotMessage(`<div class="prompt-copy-wrapper"><div class="prompt-copy-text" id="${promptId}">${escapeHtml(promptText)}</div><button class="prompt-copy-btn" data-prompt-id="${promptId}">📋 Kopyala</button></div>`, true);

                    setTimeout(() => {
                        document.querySelectorAll('.prompt-copy-btn').forEach((btn) => {
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
