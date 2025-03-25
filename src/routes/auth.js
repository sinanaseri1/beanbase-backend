import express from 'express';
import { supabase } from '../config/supabase.js';
import { body, validationResult } from 'express-validator';

export const authRouter = express.Router();

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

authRouter.post('/signup', validateSignup, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.protocol}://${req.get('host')}/auth/callback`
      }
    });

    if (error) throw error;

    res.status(201).json({
      message: 'User created successfully',
      user: data.user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({
      user: data.user,
      session: data.session
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Callback route for email confirmation
authRouter.get('/callback', async (req, res) => {
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(req.query.code);
    
    if (error) throw error;

    res.redirect('/login');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default authRouter;