const express = require('express');
const { getWorkoutRecommendation, getFitnessInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply JWT authentication protection to all AI routes to secure LLM API usage
router.use(protect);

router.post('/workout-recommendation', getWorkoutRecommendation);
router.post('/workouts-recommendation', getWorkoutRecommendation); // Alias for plural typo tolerance
router.post('/fitness-insights', getFitnessInsights);
router.post('/fitness-insight', getFitnessInsights); // Alias for singular typo tolerance

module.exports = router;
