/*
  # Initial Schema for Coffee Review Application

  1. New Tables
    - `coffees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `brand` (text)
      - `roast_level` (text)
      - `taste_notes` (text)
      - `origin` (text, optional)
      - `description` (text, optional)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `coffee_id` (uuid, references coffees)
      - `user_id` (uuid, references auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create coffees table
CREATE TABLE IF NOT EXISTS coffees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  roast_level text NOT NULL,
  taste_notes text NOT NULL,
  origin text,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coffee_id uuid REFERENCES coffees(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for coffees table
CREATE POLICY "Anyone can view coffees"
  ON coffees
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create coffees"
  ON coffees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their coffees"
  ON coffees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete their coffees"
  ON coffees
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for reviews table
CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coffees_created_by ON coffees(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_coffee_id ON reviews(coffee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);