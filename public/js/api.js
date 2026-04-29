import { API_ENDPOINT } from './state.js';

async function parseJson(response) {
    return response.json().catch(() => ({}));
}

async function requestJson(url, options, fallbackErrorMessage) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        console.error('API request failed:', { url, message: error.message });
        throw new Error('Sunucuya ulaşılamadı. Lütfen bağlantını kontrol edip tekrar dene.');
    }

    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.error || fallbackErrorMessage);
    }

    return data;
}

export async function startExperiment(payload) {
    return requestJson(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }, 'Başlatma isteği başarısız.');
}

export async function submitTestResultsApi(payload) {
    return requestJson('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }, 'Test sonuçları kaydedilemedi.');
}

export async function submitFeedbackApi(payload) {
    return requestJson('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }, 'Geri bildirim kaydedilemedi.');
}

export async function unlockAiReport(payload) {
    return requestJson('/api/unlock-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }, 'AI raporu oluşturulamadı.');
}
