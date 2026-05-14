const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experimentController');
const supabase = require('../config/supabase');
const { analysisLimiter } = require('../middleware/rateLimiters');

// GET http://localhost:3000/api/health
router.get('/health', async (req, res) => {
	try {
		const { error } = await supabase
			.from('participants')
			.select('id')
			.limit(1);

		if (error) {
			throw error;
		}

		res.status(200).json({
			status: 'ok',
			message: 'Vercel and Supabase are awake!',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			message: 'Health check failed.',
			details: error?.message || 'Unknown error'
		});
	}
});

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
// GET http://localhost:3000/api/admin/export-csv
router.get('/admin/export-csv', experimentController.exportCsv);

module.exports = router;