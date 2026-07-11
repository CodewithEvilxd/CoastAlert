import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coastalert';
const adminName = process.env.SEED_ADMIN_NAME;
const adminPhone = process.env.SEED_ADMIN_PHONE;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const adminRegion = process.env.SEED_ADMIN_REGION || 'India';

async function runSeed() {
  try {
    if (!adminName || !adminPhone || !adminPassword) {
      console.log('No seed configuration provided. Set SEED_ADMIN_NAME, SEED_ADMIN_PHONE, and SEED_ADMIN_PASSWORD to create an initial admin user.');
      process.exit(0);
    }

    console.log('Connecting to MongoDB database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const existingAdmin = await User.findOne({ phone: adminPhone });
    if (existingAdmin) {
      console.log('Admin user already exists. No changes made.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = new User({
      name: adminName,
      phone: adminPhone,
      passwordHash,
      role: 'analyst',
      region: adminRegion
    });

    await adminUser.save();
    console.log('Admin user seeded successfully.');
    process.exit(0);
  } catch (error: any) {
    console.error('Seeding script failed:', error.message || error);
    process.exit(1);
  }
}

runSeed();
