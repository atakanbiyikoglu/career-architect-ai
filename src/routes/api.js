const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');
const { analysisLimiter } = require('../middleware/rateLimiters');

// POST http://localhost:3000/api/start-experiment
router.post('/start-experiment', experimentController.startExperiment);

// POST http://localhost:3000/api/submit-test
router.post('/submit-test', analysisLimiter, experimentController.submitTest);

// POST http://localhost:3000/api/submit-feedback
router.post('/submit-feedback', experimentController.submitFeedback);

// POST http://localhost:3000/api/unlock-ai-report
router.post('/unlock-ai-report', experimentController.unlockAiReport);

// GET http://localhost:3000/api/admin/metrics
router.get('/admin/metrics', experimentController.getAdminMetrics);

module.exports = router;