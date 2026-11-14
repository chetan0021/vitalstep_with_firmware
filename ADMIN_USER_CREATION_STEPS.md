# Admin User Creation - Step by Step

## THE PROBLEM
The Edge Function is failing because:
- The admin user doesn't exist in `auth.users`
- OR the admin record doesn't exist in the `admins` table

## THE SOLUTION

### Step 1: Create Admin User in Supabase Auth

1. Go to your Supabase Dashboard
2. Click **Authentication** (left sidebar)
3. Click **Users**
4. Click **+ Add user** (top right)
5. Fill in:
   - **Email**: `admin@vitalstep.com`
   - **Password**: `Admin123!@#` (or your secure password)
   - **Auto confirm user**: Check this box ✅
6. Click **Create user**

**Write down the User ID UUID** - you'll see it in the list. It should look like:
```
09c41189-b0c7-4dc0-b9f9-153162041dfa
```

---

### Step 2: Add Admin to admins Table

1. Go to **SQL Editor** (left sidebar)
2. Click **+ New query**
3. **IMPORTANT**: Replace `YOUR_USER_UUID_HERE` with the actual UUID from Step 1
4. Run this query:

```sql
INSERT INTO public.admins (id, email, name, role, is_active)
VALUES (
  'YOUR_USER_UUID_HERE',
  'admin@vitalstep.com',
  'Manufacturing Admin',
  'device_manager',
  true
);
```

**Example** (with real UUID):
```sql
INSERT INTO public.admins (id, email, name, role, is_active)
VALUES (
  '09c41189-b0c7-4dc0-b9f9-153162041dfa',
  'admin@vitalstep.com',
  'Manufacturing Admin',
  'device_manager',
  true
);
```

---

### Step 3: Verify Both Records Exist

Run these two queries to confirm:

**Query 1:**
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@vitalstep.com';
```

**Query 2:**
```sql
SELECT id, email, is_active FROM public.admins WHERE email = 'admin@vitalstep.com';
```

Both should return a row with the same UUID.

---

### Step 4: Test Edge Function Again

Once confirmed, run the test again:

```powershell
powershell -ExecutionPolicy Bypass -File "c:\Users\Appmaker\Documents\vitalstep_with_firmware-master\test_edge_function_fresh.ps1"
```

---

## COMMON MISTAKES

1. ❌ **UUID doesn't match**: Copy-paste the UUID exactly from auth.users
2. ❌ **Forgot to enable "Auto confirm user"**: User won't be able to login
3. ❌ **Used wrong email**: Make sure it's exactly `admin@vitalstep.com`
4. ❌ **Didn't add to admins table**: Must do BOTH auth.users AND admins table

---

## IF IT STILL FAILS

Check the Edge Function logs:
1. Go to **Functions** → **generate-device-id**
2. Click **Executions** tab
3. Find the latest execution
4. Click it to see the detailed logs

The logs will show exactly where the error is happening.
