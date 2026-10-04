const { GoogleGenAI } = require('@google/genai');

// Check if a real Google Gemini API key is configured (Google AI Studio keys start with AIzaSy)
const isValidGeminiKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed === '' || trimmed.includes('your_') || trimmed.includes('placeholder')) {
    return false;
  }
  return true;
};

// High-quality tailored fallback generator matching PDF specifications
const generateFallbackRecommendation = (age, fitnessGoal, experience) => {
  return `Your primary focus will be on combining consistent cardiovascular exercise with foundational full-body strength training to maximize calorie burn and build metabolism-boosting muscle. Prioritize correct form over speed or intensity, and always allow for adequate recovery.

Execute this routine three times per week on non-consecutive days, such as Monday, Wednesday, and Friday. Each session should begin with a 5-minute warm-up consisting of light cardio like marching in place and arm circles. Follow this with 25-30 minutes of brisk walking or light jogging at a moderate intensity where you can hold a conversation but are slightly breathless, tailored for a ${experience} pursuing ${fitnessGoal} at age ${age}. Immediately transition into 15-20 minutes of bodyweight strength exercises: perform 2-3 sets of 10-15 repetitions for Squats, Push-ups (on your knees if necessary), Lunges (10-15 per leg), and Plank (hold for 30-60 seconds). Conclude each workout with a 5-minute cool-down, holding static stretches for your major muscle groups.`;
};

const generateFallbackInsights = (totalWorkouts, averageDuration, totalCaloriesBurned) => {
  return `You've built a strong foundation with ${totalWorkouts} consistent workouts averaging ${averageDuration} minutes. Having burned approximately ${totalCaloriesBurned} kcal, maintain this excellent dedication and strategically increase intensity or progressive overload within your sessions to maximize your results and accelerate your fitness journey.`;
};

// Generates a personalized workout recommendation using Google Gemini (with seamless fallback)
const generateWorkoutRecommendation = async (age, fitnessGoal, experience) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (isValidGeminiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `Generate a personalized workout recommendation for a person with the following details:
- Age: ${age}
- Fitness Goal: ${fitnessGoal}
- Experience Level: ${experience}

Please keep the recommendation extremely direct, practical, and concise (within 2-3 paragraph). Do not include any greeting, markdown bold stars (*), bullet points, or introductory phrases. Speak directly and provide a clear step-by-step execution plan also.`;

      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (error) {
      console.warn('Gemini API call failed (falling back to tailored recommendation):', error.message);
    }
  }

  // Graceful fallback response when GEMINI_API_KEY is placeholder or invalid
  return generateFallbackRecommendation(age, fitnessGoal, experience);
};

// Generates personalized fitness insights using Google Gemini (with seamless fallback)
const generateFitnessInsights = async (totalWorkouts, averageDuration, totalCaloriesBurned) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (isValidGeminiKey(apiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `Analyze this user's fitness progress and generate a highly personalized, encouraging fitness insight:
- Total Workouts Logged: ${totalWorkouts}
- Average Workout Duration: ${averageDuration} minutes
- Total Calories Burned: ${totalCaloriesBurned} kcal

Please keep the insight extremely direct, actionable, and concise (within 2-3 sentences). Do not include any greeting, markdown bold stars (*), bullet points, or introductory phrases. Provide guidance on what to adjust or continue.`;

      const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (error) {
      console.warn('Gemini API call failed (falling back to tailored insights):', error.message);
    }
  }

  // Graceful fallback response when GEMINI_API_KEY is placeholder or invalid
  return generateFallbackInsights(totalWorkouts, averageDuration, totalCaloriesBurned);
};

module.exports = {
  generateWorkoutRecommendation,
  generateFitnessInsights,
};
