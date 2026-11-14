-- This recreates the device_inventory table with nullable created_by
-- Run this in Supabase SQL Editor to fix the foreign key constraint issue

DROP TABLE IF EXISTS public.device_inventory CASCADE;

-- Device inventory (track all manufactured devices) - FIXED
CREATE TABLE public.device_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code text UNIQUE NOT NULL,
  device_secret text UNIQUE NOT NULL,
  status text DEFAULT 'manufactured',
  paired_user_id uuid,
  paired_at timestamp,
  notes text,
  created_at timestamp DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;

-- Anyone can read device inventory
CREATE POLICY "device_inventory_public_read" ON public.device_inventory
  FOR SELECT USING (true);

-- Only admins can insert devices
CREATE POLICY "admins_insert_devices" ON public.device_inventory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );

-- Only admins can update devices
CREATE POLICY "admins_update_devices" ON public.device_inventory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );
