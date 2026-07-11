import bcrypt from 'bcryptjs';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const adminName = process.env.SEED_ADMIN_NAME;
const adminPhone = process.env.SEED_ADMIN_PHONE;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const adminRegion = process.env.SEED_ADMIN_REGION || 'India';

/**
 * Seeds the active Mongoose connection with a configured admin user only.
 * This helper does not seed reports, alerts, or social feeds.
 */
export async function seedDatabase() {
  if (!adminName || !adminPhone || !adminPassword) {
    console.log('Seed configuration missing. No admin user was created.');
    return;
  }

  const existingAdmin = await User.findOne({ phone: adminPhone });
  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const newUser = new User({
    name: adminName,
    phone: adminPhone,
    passwordHash,
    role: 'analyst',
    region: adminRegion
  });
  await newUser.save();
  console.log('Admin user seeded successfully.');
}
