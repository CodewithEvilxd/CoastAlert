import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'COASTALERT_JWT_SECRET_FALLBACK_2026';

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, phone, password, role, region, savedLocation } = req.body;

    if (!name || !phone || !password) {
      res.status(400).json({ message: 'Name, phone number, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      res.status(400).json({ message: 'Phone number already registered' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      phone,
      passwordHash,
      role: role || 'citizen',
      region,
      savedLocation
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        region: newUser.region,
        savedLocation: newUser.savedLocation
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ message: 'Phone number and password are required' });
      return;
    }

    // Check user exists
    const user = await User.findOne({ phone });
    if (!user) {
      res.status(400).json({ message: 'Invalid phone number or password' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid phone number or password' });
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        region: user.region,
        savedLocation: user.savedLocation
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching user profile', error: error.message });
  }
}

export async function updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { region, savedLocation } = req.body;
    if (!region) {
      res.status(400).json({ message: 'Region is required' });
      return;
    }
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.region = region;
    if (savedLocation) {
      user.savedLocation = savedLocation;
    }
    await user.save();
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
}
