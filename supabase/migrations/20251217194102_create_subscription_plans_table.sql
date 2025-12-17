/*
  # Create Subscription Plans Table

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key) - Unique identifier for the plan
      - `name` (text) - Name of the subscription plan (e.g., "Basic", "Pro", "Enterprise")
      - `description` (text) - Brief description of the plan
      - `price` (numeric) - Monthly price of the plan
      - `features` (jsonb) - Array of features included in the plan
      - `max_instances` (integer) - Maximum number of WhatsApp instances allowed
      - `max_messages_per_day` (integer) - Maximum messages per day limit
      - `is_active` (boolean) - Whether the plan is currently available for subscription
      - `display_order` (integer) - Order in which plans should be displayed
      - `created_at` (timestamptz) - When the plan was created
      - `updated_at` (timestamptz) - When the plan was last updated

  2. Security
    - Enable RLS on `subscription_plans` table
    - Add policy for authenticated users to read active plans
    - Add policy for admin users to manage all plans
*/

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_instances integer NOT NULL DEFAULT 1,
  max_messages_per_day integer NOT NULL DEFAULT 1000,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read active plans
CREATE POLICY "Authenticated users can view active plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy for admins to view all plans
CREATE POLICY "Admins can view all plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to insert plans
CREATE POLICY "Admins can insert plans"
  ON subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to update plans
CREATE POLICY "Admins can update plans"
  ON subscription_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy for admins to delete plans
CREATE POLICY "Admins can delete plans"
  ON subscription_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_updated_at'
  ) THEN
    CREATE TRIGGER update_subscription_plans_updated_at
      BEFORE UPDATE ON subscription_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;