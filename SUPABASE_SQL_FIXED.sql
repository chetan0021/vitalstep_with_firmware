-- ========================================
-- ADMIN MANUFACTURING DASHBOARD - SQL SETUP
-- Copy and paste this entire file into Supabase SQL Editor
-- ========================================

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'device_manager',
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Device inventory (track all manufactured devices)
CREATE TABLE IF NOT EXISTS public.device_inventory (
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

-- Audit log
CREATE TABLE IF NOT EXISTS public.device_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  device_code text NOT NULL,
  details text,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_audit ENABLE ROW LEVEL SECURITY;

-- Admin can see own profile
CREATE POLICY "admins_read_own" ON public.admins
  FOR SELECT USING (auth.uid() = id);

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

-- Admins can insert audit logs
CREATE POLICY "admins_audit_insert" ON public.device_audit
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = true)
  );
