/*
  # Add Image Support for Coffees

  1. Changes
    - Add `image_url` column to `coffees` table
    - Update validation to include image URL

  2. Notes
    - Image URLs should point to publicly accessible images
    - URLs will be validated on the API level
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coffees' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE coffees ADD COLUMN image_url text;
  END IF;
END $$;