const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Cok fazla istek gonderdiniz. Lutfen daha sonra tekrar deneyin.' }
});

const analysisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Bu IP icin 1 saatlik analiz limiti doldu (max 3).' }
});

module.exports = {
    apiLimiter,
    analysisLimiter
};
