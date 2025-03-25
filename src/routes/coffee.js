import express from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { upload } from '../config/multer.js';
import { processImage } from '../utils/imageProcessor.js';

export const coffeeRouter = express.Router();

const validateCoffee = [
  body('name').notEmpty().trim(),
  body('brand').notEmpty().trim(),
  body('roast_level').isIn(['light', 'medium', 'dark']),
  body('taste_notes').notEmpty().trim(),
  body('origin').optional().trim(),
  body('description').optional().trim(),
  body('image_url').optional().isURL().withMessage('Image URL must be a valid URL'),
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

// Create coffee with URL
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

// Create coffee with image upload
coffeeRouter.post('/upload', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImageBuffer = await processImage(req.file.buffer);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('coffee-images')
      .upload(fileName, processedImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('coffee-images')
      .getPublicUrl(fileName);

    // Create coffee entry with the image URL
    const { data: coffeeData, error: coffeeError } = await supabase
      .from('coffees')
      .insert([{
        ...req.body,
        created_by: req.user.id,
        image_url: publicUrl
      }])
      .select()
      .single();

    if (coffeeError) throw coffeeError;

    res.status(201).json(coffeeData);
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

// Update coffee with image upload
coffeeRouter.put('/:id/upload', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Process the image
    const processedImageBuffer = await processImage(req.file.buffer);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('coffee-images')
      .upload(fileName, processedImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('coffee-images')
      .getPublicUrl(fileName);

    // Update coffee entry with the new image URL
    const { data: coffeeData, error: coffeeError } = await supabase
      .from('coffees')
      .update({
        ...req.body,
        image_url: publicUrl
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (coffeeError) throw coffeeError;

    res.json(coffeeData);
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

export default coffeeRouter;