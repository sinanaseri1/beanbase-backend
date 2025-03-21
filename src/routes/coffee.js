import express from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

export const coffeeRouter = express.Router();

const validateCoffee = [
  body('name').notEmpty().trim(),
  body('brand').notEmpty().trim(),
  body('roast_level').isIn(['light', 'medium', 'dark']),
  body('taste_notes').notEmpty().trim(),
  body('origin').optional().trim(),
  body('description').optional().trim(),
];

// Get all coffees
coffeeRouter.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coffees')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single coffee
coffeeRouter.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coffees')
      .select('*, reviews(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create coffee
coffeeRouter.post('/', authenticateUser, validateCoffee, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coffees')
      .insert([{ ...req.body, created_by: req.user.id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update coffee
coffeeRouter.put('/:id', authenticateUser, validateCoffee, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coffees')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete coffee
coffeeRouter.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('coffees')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});