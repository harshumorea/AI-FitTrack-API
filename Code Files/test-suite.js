/**
 * AI FitTrack API - Comprehensive End-to-End Automated Test Suite
 * Covers all requirements from AI FitTrack.pdf and API Testing Video.
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const User = require('./src/models/User');
const Workout = require('./src/models/Workout');

const PORT = 5099; // Test-specific isolated port
let server;
let baseUrl = `http://localhost:${PORT}`;

const testState = {
  passed: 0,
  failed: 0,
  results: [],
};

const assert = (condition, description, actualValue) => {
  if (condition) {
    testState.passed++;
    console.log(`  ✅ PASS: ${description}`);
    testState.results.push({ description, status: 'PASS', details: actualValue });
  } else {
    testState.failed++;
    console.error(`  ❌ FAIL: ${description} (Got: ${JSON.stringify(actualValue)})`);
    testState.results.push({ description, status: 'FAIL', details: actualValue });
  }
};

async function runTestSuite() {
  console.log('====================================================');
  console.log('   AI FitTrack API — Full Verification Test Suite   ');
  console.log('====================================================\n');

  // 1. Connect DB and start test server
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fittrack');
  console.log('Connected to MongoDB database.\n');

  server = app.listen(PORT);
  await new Promise((resolve) => server.on('listening', resolve));
  console.log(`Test server running at ${baseUrl}\n`);

  const timestamp = Date.now();
  const testUser1 = {
    name: 'Sathya Test',
    email: `sathya_${timestamp}@gmail.com`,
    password: 'Sathya@01',
  };

  const testUser2 = {
    name: 'Other User',
    email: `other_${timestamp}@gmail.com`,
    password: 'Password@123',
  };

  let token1 = '';
  let user1Id = '';
  let token2 = '';
  let workoutId = '';
  let workout2Id = '';

  try {
    // ----------------------------------------------------
    // Section 1: Health Check Endpoint
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Server Gateway & Health ---');
    const healthRes = await fetch(`${baseUrl}/`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returns status 200', healthRes.status);
    assert(healthJson.success === true, 'Health check returns success: true', healthJson.success);

    // ----------------------------------------------------
    // Section 2: Authentication API Testing (PDF Page 27-28)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Authentication APIs ---');
    
    // 2.1 Register User
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser1),
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created', regRes.status);
    assert(regJson.success === true, 'Register response contains success: true', regJson.success);
    assert(typeof regJson.token === 'string' && regJson.token.length > 0, 'Register returns JWT token', !!regJson.token);
    assert(regJson.user && regJson.user.email === testUser1.email, 'Register returns correct user object', regJson.user?.email);
    token1 = regJson.token;
    user1Id = regJson.user?.id;

    // 2.2 Login User
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser1.email, password: testUser1.password }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK', loginRes.status);
    assert(loginJson.success === true, 'Login response contains success: true', loginJson.success);
    assert(typeof loginJson.token === 'string', 'Login returns JWT token', !!loginJson.token);
    assert(loginJson.user && loginJson.user.id === user1Id, 'Login returns matched user info', loginJson.user?.id);

    // 2.3 Get Profile (Protected)
    const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
    });
    const profileJson = await profileRes.json();
    assert(profileRes.status === 200, 'GET /api/auth/profile returns 200 OK', profileRes.status);
    assert(profileJson.success === true, 'Profile response contains success: true', profileJson.success);
    assert(profileJson.user?.email === testUser1.email, 'Profile returns authenticated user email', profileJson.user?.email);

    // Register User 2 for Cross-User Isolation checks
    const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser2),
    });
    const reg2Json = await reg2Res.json();
    token2 = reg2Json.token;

    // ----------------------------------------------------
    // Section 3: Workout API Testing (PDF Page 29-31)
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Workout Management APIs ---');

    // 3.1 Add Workout (Evening Jog - Running)
    const addWorkoutPayload = {
      workoutName: 'Evening Jog',
      category: 'Running',
      duration: 30,
      caloriesBurned: 350,
      workoutDate: '2026-06-26T00:00:00.000Z',
    };
    const addRes = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addWorkoutPayload),
    });
    const addJson = await addRes.json();
    assert(addRes.status === 201, 'POST /api/workouts returns 201 Created', addRes.status);
    assert(addJson.success === true, 'Add workout returns success: true', addJson.success);
    assert(addJson.data?.workoutName === 'Evening Jog', 'Workout name matches', addJson.data?.workoutName);
    assert(addJson.data?.category === 'Running', 'Workout category matches', addJson.data?.category);
    assert(addJson.data?.duration === 30, 'Workout duration matches', addJson.data?.duration);
    assert(addJson.data?.caloriesBurned === 350, 'Workout calories burned matches', addJson.data?.caloriesBurned);
    workoutId = addJson.data?._id;

    // 3.2 Add Second Workout (Upper Body Strength - Strength Training)
    const add2Res = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workoutName: 'Upper Body Strength',
        category: 'Strength Training',
        duration: 45,
        caloriesBurned: 280,
      }),
    });
    const add2Json = await add2Res.json();
    assert(add2Res.status === 201, 'POST second workout returns 201 Created', add2Res.status);
    workout2Id = add2Json.data?._id;

    // 3.3 Get All Workouts
    const getAllRes = await fetch(`${baseUrl}/api/workouts`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const getAllJson = await getAllRes.json();
    assert(getAllRes.status === 200, 'GET /api/workouts returns 200 OK', getAllRes.status);
    assert(getAllJson.success === true, 'Get all workouts returns success: true', getAllJson.success);
    assert(getAllJson.count === 2, 'Get all workouts count is 2', getAllJson.count);
    assert(Array.isArray(getAllJson.data) && getAllJson.data.length === 2, 'Data is array of 2 workouts', getAllJson.data?.length);

    // 3.4 Get Workout By ID
    const getByIdRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const getByIdJson = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'GET /api/workouts/:id returns 200 OK', getByIdRes.status);
    assert(getByIdJson.success === true, 'Get workout by id returns success: true', getByIdJson.success);
    assert(getByIdJson.data?._id === workoutId, 'Retrieved workout has matching _id', getByIdJson.data?._id);

    // 3.5 Update Workout
    const updatePayload = {
      workoutName: 'Evening Jog',
      category: 'Running',
      duration: 60,
      caloriesBurned: 650,
      workoutDate: '2026-06-26',
    };
    const updateRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });
    const updateJson = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /api/workouts/:id returns 200 OK', updateRes.status);
    assert(updateJson.success === true, 'Update workout returns success: true', updateJson.success);
    assert(updateJson.data?.duration === 60, 'Updated duration is 60', updateJson.data?.duration);
    assert(updateJson.data?.caloriesBurned === 650, 'Updated caloriesBurned is 650', updateJson.data?.caloriesBurned);

    // ----------------------------------------------------
    // Section 4: Workout Search API Testing
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Workout Search APIs ---');

    // 4.1 Search by Category / Keyword
    const searchCatRes = await fetch(`${baseUrl}/api/workouts/search?q=running`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const searchCatJson = await searchCatRes.json();
    assert(searchCatRes.status === 200, 'GET /api/workouts/search?q=running returns 200 OK', searchCatRes.status);
    assert(searchCatJson.success === true, 'Search response has success: true', searchCatJson.success);
    assert(searchCatJson.count >= 1, 'Search finds at least 1 running workout', searchCatJson.count);

    // 4.2 Search by Date
    const searchDateRes = await fetch(`${baseUrl}/api/workouts/search?q=2026-06-26`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const searchDateJson = await searchDateRes.json();
    assert(searchDateRes.status === 200, 'GET /api/workouts/search?q=2026-06-26 returns 200 OK', searchDateRes.status);
    assert(searchDateJson.success === true, 'Date search response has success: true', searchDateJson.success);
    assert(searchDateJson.count >= 1, 'Date search finds workout on 2026-06-26', searchDateJson.count);

    // ----------------------------------------------------
    // Section 5: Data Isolation & Delete Operations
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Authorization & Data Isolation ---');

    // 5.1 User 2 cannot access User 1's workout
    const user2GetRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token2}` },
    });
    assert(user2GetRes.status === 404, 'User 2 accessing User 1 workout returns 404', user2GetRes.status);

    // 5.2 User 2 cannot update User 1's workout
    const user2PutRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration: 99 }),
    });
    assert(user2PutRes.status === 404, 'User 2 updating User 1 workout returns 404', user2PutRes.status);

    // 5.3 User 2 cannot delete User 1's workout
    const user2DelRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token2}` },
    });
    assert(user2DelRes.status === 404, 'User 2 deleting User 1 workout returns 404', user2DelRes.status);

    // 5.4 Delete Workout by Owner (User 1)
    const deleteRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    const deleteJson = await deleteRes.json();
    assert(deleteRes.status === 200, 'DELETE /api/workouts/:id returns 200 OK', deleteRes.status);
    assert(deleteJson.success === true, 'Delete workout returns success: true', deleteJson.success);
    assert(deleteJson.message === 'Workout removed successfully', 'Delete message matches', deleteJson.message);

    // 5.5 Verify workout no longer exists
    const verifyDelRes = await fetch(`${baseUrl}/api/workouts/${workoutId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    assert(verifyDelRes.status === 404, 'Deleted workout cannot be retrieved (404)', verifyDelRes.status);

    // ----------------------------------------------------
    // Section 6: Negative Cases & Input Validation
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: Negative & Edge Case Validation ---');

    // 6.1 Missing Auth Token
    const noTokenRes = await fetch(`${baseUrl}/api/workouts`, { method: 'GET' });
    assert(noTokenRes.status === 401, 'Request without token returns 401 Unauthorized', noTokenRes.status);

    // 6.2 Invalid Auth Token
    const badTokenRes = await fetch(`${baseUrl}/api/workouts`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_garbage_token' },
    });
    assert(badTokenRes.status === 401, 'Request with invalid token returns 401 Unauthorized', badTokenRes.status);

    // 6.3 Invalid Login Credentials
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser1.email, password: 'WrongPassword!' }),
    });
    assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized', badLoginRes.status);

    // 6.4 Duplicate Email Registration
    const dupRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser1),
    });
    assert(dupRegRes.status === 400, 'Duplicate email registration returns 400 Bad Request', dupRegRes.status);

    // 6.5 Registration missing required fields
    const missRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete' }),
    });
    assert(missRegRes.status === 400, 'Registration missing fields returns 400 Bad Request', missRegRes.status);

    // 6.6 Invalid Workout category
    const badCatRes = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workoutName: 'Swimming Session',
        category: 'Underwater Hockey', // Unsupported category
        duration: 30,
        caloriesBurned: 200,
      }),
    });
    assert(badCatRes.status === 400, 'Unsupported workout category returns 400 Validation Error', badCatRes.status);

    // 6.7 Invalid Workout Duration (0 or negative)
    const badDurRes = await fetch(`${baseUrl}/api/workouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workoutName: 'Quick Stretch',
        category: 'Yoga',
        duration: 0, // min is 1
        caloriesBurned: 10,
      }),
    });
    assert(badDurRes.status === 400, 'Zero duration returns 400 Validation Error', badDurRes.status);

    // 6.8 Malformed ObjectId
    const malformedIdRes = await fetch(`${baseUrl}/api/workouts/invalid-mongo-id-123`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    assert(malformedIdRes.status === 404, 'Malformed workout ObjectId returns 404', malformedIdRes.status);

    // 6.9 Search without ?q parameter
    const noQuerySearchRes = await fetch(`${baseUrl}/api/workouts/search`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` },
    });
    assert(noQuerySearchRes.status === 400, 'Search without ?q parameter returns 400 Bad Request', noQuerySearchRes.status);

    // ----------------------------------------------------
    // Section 7: AI APIs & Missing Key Graceful Handling
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 7: AI Features & Error Handling ---');

    // 7.1 AI Recommendation Input Validation (missing fields)
    const badAiRecRes = await fetch(`${baseUrl}/api/ai/workout-recommendation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ age: 25 }), // Missing fitnessGoal and experience
    });
    assert(badAiRecRes.status === 400, 'AI Recommendation missing fields returns 400', badAiRecRes.status);

    // 7.2 AI Fitness Insights Input Validation (missing fields)
    const badAiInsRes = await fetch(`${baseUrl}/api/ai/fitness-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ totalWorkouts: 5 }), // Missing averageDuration and totalCaloriesBurned
    });
    assert(badAiInsRes.status === 400, 'AI Fitness Insights missing fields returns 400', badAiInsRes.status);

    // 7.3 Handling of Missing GEMINI_API_KEY
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    if (!hasGeminiKey) {
      console.log('  ℹ️  GEMINI_API_KEY is not configured in .env (testing graceful degradation)');
      const noKeyAiRes = await fetch(`${baseUrl}/api/ai/workout-recommendation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: 22,
          fitnessGoal: 'Weight Loss',
          experience: 'Beginner',
        }),
      });
      const noKeyAiJson = await noKeyAiRes.json();
      assert(
        noKeyAiRes.status === 503 || noKeyAiRes.status === 500,
        'Missing Gemini API key handled gracefully with status 503/500',
        noKeyAiRes.status
      );
      assert(
        noKeyAiJson.success === false && typeof noKeyAiJson.error === 'string',
        'Missing key returns standardized JSON error response',
        noKeyAiJson.error
      );
    } else {
      console.log('  ℹ️  GEMINI_API_KEY is present, testing live AI generation');
      const liveAiRecRes = await fetch(`${baseUrl}/api/ai/workout-recommendation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: 22,
          fitnessGoal: 'Weight Loss',
          experience: 'Beginner',
        }),
      });
      const liveAiRecJson = await liveAiRecRes.json();
      assert(liveAiRecRes.status === 200, 'Live AI Workout Recommendation returns 200 OK', liveAiRecRes.status);
      assert(typeof liveAiRecJson.recommendation === 'string', 'Returns recommendation string', !!liveAiRecJson.recommendation);

      const liveAiInsRes = await fetch(`${baseUrl}/api/ai/fitness-insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalWorkouts: 18,
          averageDuration: 45,
          totalCaloriesBurned: 6200,
        }),
      });
      const liveAiInsJson = await liveAiInsRes.json();
      assert(liveAiInsRes.status === 200, 'Live AI Fitness Insights returns 200 OK', liveAiInsRes.status);
      assert(typeof liveAiInsJson.insight === 'string', 'Returns insight string', !!liveAiInsJson.insight);
    }

  } finally {
    // ----------------------------------------------------
    // Section 8: Safe Cleanup of Test Artifacts
    // ----------------------------------------------------
    console.log('\n--- CLEANUP: Removing Test Users and Workouts ---');
    try {
      if (user1Id) {
        await User.findByIdAndDelete(user1Id);
        await Workout.deleteMany({ user: user1Id });
      }
      if (token2) {
        const u2 = await User.findOne({ email: testUser2.email });
        if (u2) {
          await User.findByIdAndDelete(u2._id);
          await Workout.deleteMany({ user: u2._id });
        }
      }
      if (workout2Id) {
        await Workout.findByIdAndDelete(workout2Id);
      }
      console.log('  🧹 Test users and test workouts cleaned up successfully.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
    }

    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS SUMMARY:`);
  console.log(`  Total Passed: ${testState.passed}`);
  console.log(`  Total Failed: ${testState.failed}`);
  console.log('====================================================\n');

  if (testState.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
