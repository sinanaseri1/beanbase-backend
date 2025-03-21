import express from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

export const reviewRouter = express.Router();

const validateReview = [
  body('coffee_id').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').notEmpty().trim(),
];

// Get reviews for a coffee
reviewRouter.get('/coffee/:coffeeId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users:user_id(email)')
      .eq('coffee_id', req.params.coffeeId);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
reviewRouter.post('/', authenticateUser, validateReview, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ ...req.body, user_id: req.user.id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});