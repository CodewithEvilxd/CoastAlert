import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/User';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_coastalert_2026';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coastalert';

async function run() {
  console.log('--- STARTING JWT GENERATOR & DATABASE CONNECTION CHECK ---');
  let mongoServer: MongoMemoryServer | null = null;
  
  try {
    console.log(`Connecting to database at URI: ${MONGODB_URI}...`);
    // Try to connect to real MongoDB (local or Atlas)
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✔ Connected to persistent MongoDB successfully!');
  } catch (err) {
    console.log('Local/Persistent MongoDB not active. Launching temporary MongoMemoryServer...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('✔ Connected to temporary In-Memory MongoDB successfully!');
  }

  try {
    // 1. Check if Ramesh Prasad exists, if not create a mock Ramesh
    let user = await User.findOne({ phone: '9876543210' });
    if (!user) {
      console.log('Mock user "Ramesh Prasad" not found. Creating inline...');
      user = await User.create({
        name: 'Ramesh Prasad',
        phone: '9876543210',
        passwordHash: 'hashedpassword_inline',
        role: 'citizen',
        region: 'Mumbai',
        alertsSubscribed: true
      });
      console.log('✔ Inline mock user created.');
    }

    console.log(`User Info Found: ${user.name} | Role: ${user.role} | ID: ${user._id}`);

    // 2. Generate JWT authorization token
    const token = jwt.sign(
      { id: user._id, role: user.role, region: user.region },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('\n======================================================');
    console.log('🔑 GENERATED JWT AUTHORIZATION TOKEN:');
    console.log(token);
    console.log('======================================================\n');
    
    console.log('✔ MongoDB connection is Active. Database name:', mongoose.connection.name);
  } catch (err: any) {
    console.error('❌ Error executing JWT & DB queries:', err.message);
  } finally {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('--- CONNECTION CLOSED SUCCESSFULLY ---');
  }
}

run();
