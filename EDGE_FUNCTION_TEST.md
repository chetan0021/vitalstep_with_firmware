# 🧪 Edge Function Testing - generate-device-id

## Test the Edge Function Internally in Supabase

### Step 1: Get Your Admin User Token

Go to Supabase Dashboard → **SQL Editor** → Run this:

```sql
SELECT id, email FROM auth.users WHERE email = 'admin@vitalstep.com';
```

Copy the `id` (UUID)

---

### Step 2: Create a Test Token (Supabase CLI method)

If you have Supabase CLI installed:

```bash
supabase start
supabase functions serve
```

If not, use the browser console method below.

---

### Step 3: Test via Supabase Dashboard

Go to **Edge Functions** → Click on `generate-device-id` → **Function Details**

Scroll down to **Test** section

In the **Request Body**, paste:

```json
{
  "test": true
}
```

In **Headers**, add:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

Click **Send**

---

### Expected Response:

```json
{
  "ok": true,
  "device_code": "VS-001002",
  "device_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "created_at": "2024-11-13T10:30:45.123Z"
}
```

---

### Step 4: Verify in Database

Go to **SQL Editor** → Run:

```sql
SELECT * FROM device_inventory ORDER BY created_at DESC LIMIT 5;
```

You should see the newly generated device with status 'manufactured'

---

### If Error "Not an authorized admin"

This means the admin user wasn't properly added. Run this SQL:

```sql
-- Check if admin exists
SELECT * FROM admins WHERE email = 'admin@vitalstep.com';

-- If empty, add them (replace UUID with your actual admin user ID)
INSERT INTO admins (id, email, name, role, is_active)
VALUES ('YOUR_ADMIN_USER_ID', 'admin@vitalstep.com', 'Admin', 'device_manager', true);
```

---

Once testing is complete, reply:
✅ "Edge function tested and working!"

Then I'll build the professional Next.js frontend.
