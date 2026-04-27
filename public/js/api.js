import { API_ENDPOINT } from './state.js';

async function parseJson(response) {
    return response.json().catch(() => ({}));
}

export async function startExperiment(payload) {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.error || 'Başlatma isteği başarısız.');
    }

    return data;
}

export async function submitTestResultsApi(payload) {
    const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.error || 'Test sonuçları kaydedilemedi.');
    }

    return data;
}

export async function submitFeedbackApi(payload) {
    const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.error || 'Geri bildirim kaydedilemedi.');
    }

    return data;
}

export async function unlockAiReport(payload) {
    const response = await fetch('/api/unlock-ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await parseJson(response);
    if (!response.ok) {
        throw new Error(data.error || 'AI raporu oluşturulamadı.');
    }

    return data;
}
