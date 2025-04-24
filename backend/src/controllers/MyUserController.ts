import { Request, Response } from 'express';
import User from '../models/user';

// Get the current user
const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.auth0Id is set by jwtParse middleware
    const auth0Id = req.auth0Id;

    if (!auth0Id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const currentUser = await User.findOne({ auth0Id });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(currentUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error getting user' });
  }
};

// Create a new user
const createCurrentUser = async (req: Request, res: Response) => {
  try {
    const { auth0Id } = req.body;
    const existingUser = await User.findOne({ auth0Id });

    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json(newUser.toObject());
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

export default {
  getCurrentUser,
  createCurrentUser,
};
