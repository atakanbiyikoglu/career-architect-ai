const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- Bunu ekle
require('dotenv').config();
const { apiLimiter } = require('./src/middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 3000;

const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
console.log('[Startup] GROQ_API_KEY durumu:', groqApiKey ? 'mevcut' : 'eksik');
if (groqApiKey) {
    console.log('[Startup] GROQ_API_KEY uzunluğu:', groqApiKey.length, 'son4:', groqApiKey.slice(-4));
}
console.log('[Startup] GEMINI_API_KEY durumu:', geminiApiKey ? 'mevcut' : 'eksik');
if (geminiApiKey) {
    console.log('[Startup] GEMINI_API_KEY uzunluğu:', geminiApiKey.length, 'son4:', geminiApiKey.slice(-4));
}

try {
    require('./src/services/aiService');
    console.log('[Startup] aiService modülü başarıyla yüklendi.');
} catch (error) {
    console.error('[Startup] aiService başlatma hatası:', error?.message, error?.code || 'NO_CODE');
}

app.use(cors());
app.use(express.json());

// 👇 FRONTEND DOSYALARINI SUNMA AYARI
// 'public' klasörünü statik olarak dışarı açıyoruz.
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiLimiter, require('./src/routes/api'));

// Ana sayfaya gidince index.html çalışsın
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Sunucu ve Frontend http://localhost:${PORT} adresinde çalışıyor\n`);
});