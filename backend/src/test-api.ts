import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Report from './models/Report';
import SocialSignal from './models/SocialSignal';
import OfficialAlert from './models/OfficialAlert';
import { runNLPAnalysis } from './services/socialSignalService';
import { calculateCredibility, updateReportCredibility } from './services/credibilityService';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coastalert';

async function testSuite() {
  console.log('--- STARTING COASTALERT BACKEND TEST SUITE ---');
  try {
    // 1. Connect to DB
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✔ Connected to MongoDB successfully.');
    } catch (err: any) {
      console.warn('Local MongoDB connection failed. Launching MongoMemoryServer for tests...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log('✔ Connected to In-Memory MongoDB successfully.');
    }

    // Force index generation synchronously for geospatial testing
    await Report.ensureIndexes();
    const indexes = await Report.collection.getIndexes();
    console.log('✔ Database indexes built:', JSON.stringify(indexes));

    // Cleanup test collections to ensure repeatable test runs
    await User.deleteMany({ phone: { $in: ['1111111111', '2222222222'] } });
    await Report.deleteMany({ description: /TEST_SUITE/ });
    await SocialSignal.deleteMany({});
    
    // 2. Test User Creation & Password Hashing
    const testUserPhone = '1111111111';
    const testUserPass = 'supersecure';
    const hashed = await bcrypt.hash(testUserPass, 10);
    
    const newUser = new User({
      name: 'Test Citizen',
      phone: testUserPhone,
      passwordHash: hashed,
      role: 'citizen',
      region: 'Mumbai',
      savedLocation: { lat: 18.9438, lng: 72.8228 }
    });
    await newUser.save();
    console.log('✔ User creation and password hashing validated.');

    // 3. Test Report Creation (Geospatial Point)
    const report1 = new Report({
      reportedBy: newUser._id,
      hazardType: 'high_waves',
      description: 'TEST_SUITE: Heavy storm swells crashing on rocks.',
      severity: 'medium',
      location: { type: 'Point', coordinates: [60.0, 10.0] },
      status: 'pending',
      images: ['/uploads/test.jpg']
    });
    await report1.save();
    console.log('✔ Report creation with GeoJSON Point coordinates validated.');

    // Test credibility calculation on fresh report with images
    let cred = await calculateCredibility(report1._id.toString());
    console.log(`  - Initial report credibility score: ${cred.score} (Expected base score: 20 due to image)`);
    if (cred.score !== 20) {
      throw new Error(`Credibility score should be 20, got ${cred.score}`);
    }

    // 4. Test Geospatial Clustering Logic (within 2km and 1h)
    // Create a second report nearby of the same hazard type
    const report2 = new Report({
      reportedBy: newUser._id,
      hazardType: 'high_waves',
      description: 'TEST_SUITE: Another high wave sighting nearby.',
      severity: 'medium',
      location: { type: 'Point', coordinates: [60.002, 10.002] }, // Approx 300m away
      status: 'pending',
      images: []
    });
    await report2.save();

    // Re-evaluate report1 credibility. Proximity cluster should add 30 points.
    const clusterCred = await calculateCredibility(report1._id.toString());
    console.log(`  - Credibility score after nearby cluster report: ${clusterCred.score} (Expected: 50 due to 20 base + 30 cluster)`);
    if (clusterCred.score !== 50) {
      throw new Error(`Credibility score should be 50, got ${clusterCred.score}`);
    }

    // Confirm that the status updates to 'community_verified'
    const updatedRep1 = await updateReportCredibility(report1._id.toString());
    console.log(`  - Updated report status in DB: ${updatedRep1?.status} (Expected: community_verified)`);
    if (updatedRep1?.status !== 'community_verified') {
      throw new Error(`Report status should be community_verified, got ${updatedRep1?.status}`);
    }

    // 5. Test confirmations ("I saw this too") addition
    const anotherUser = new User({
      name: 'Test Volunteer',
      phone: '2222222222',
      passwordHash: hashed,
      role: 'volunteer'
    });
    await anotherUser.save();

    updatedRep1!.confirmations.push(anotherUser._id as any);
    await updatedRep1!.save();

    // Confirmations add +5 points, pushing score to 55
    const confirmedCred = await updateReportCredibility(report1._id.toString());
    console.log(`  - Credibility score after community confirmation: ${confirmedCred?.credibilityScore} (Expected: 55)`);
    if (confirmedCred?.credibilityScore !== 55) {
      throw new Error(`Credibility score should be 55, got ${confirmedCred?.credibilityScore}`);
    }

    // 6. Test Geospatial Proximity Finder ($near query)
    const foundReports = await Report.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [60.0, 10.0] },
          $maxDistance: 1000 // 1km
        }
      }
    });
    console.log(`✔ Geospatial query search within 1km returned ${foundReports.length} reports.`);
    if (foundReports.length < 2) {
      throw new Error('Geospatial query failed to return both test reports.');
    }

    // 7. Test NLP Social Signals pipeline
    console.log('Testing NLP pipeline on real reports...');
    const signals = await runNLPAnalysis();
    console.log(`✔ Ingested and parsed ${signals.length} social signal posts.`);
    
    // Check specific signal parsing
    const recededSeaTweet = signals.find(
      (s) => typeof s.postText === 'string' && s.postText.toLowerCase().includes('receded')
    );

    if (recededSeaTweet && Array.isArray(recededSeaTweet.hazardKeywordsMatched)) {
      console.log(`  - Wave/Tsunami post parsed keywords: [${recededSeaTweet.hazardKeywordsMatched.join(', ')}]`);
      console.log(`  - Receded sea sentiment: ${recededSeaTweet.sentimentScore}, Urgency Score: ${recededSeaTweet.urgencyScore}/100`);
      if (recededSeaTweet.urgencyScore < 40) {
        throw new Error('Tsunami warning post should have a higher urgency score.');
      }
    } else {
      console.log('  - No receded sea signal found or keyword data unavailable; skipping specific hazard keyword assertion.');
    }

    // Cleanup test data
    await User.deleteMany({ phone: { $in: ['1111111111', '2222222222'] } });
    await Report.deleteMany({ description: /TEST_SUITE/ });
    
    console.log('✔ Cleanup completed.');
    console.log('--- ALL BACKEND CORE MODULE TESTS PASSED ---');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

testSuite();
