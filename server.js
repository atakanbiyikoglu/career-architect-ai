const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- Bunu ekle
require('dotenv').config();
const { apiLimiter } = require('./src/middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 3000;

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