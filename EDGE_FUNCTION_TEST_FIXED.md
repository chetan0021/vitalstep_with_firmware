# 🧪 Edge Function Testing - Fixed Method

The issue: The Supabase test UI doesn't generate proper auth tokens. We need to use a different approach.

---

## Method 1: Test via curl (Recommended)

### Step 1: Get Admin Auth Token

Go to Supabase Dashboard → **Authentication** → **Users**
Find `admin@vitalstep.com` user

Go to your local machine terminal and run:

```bash
curl --location 'https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "admin@vitalstep.com",
    "password": "Admin123!@#"
  }'
```

You'll get a response like:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "..."
}
```

**Copy the `access_token` value** (the long string starting with `eyJ...`)

---

### Step 2: Test Edge Function

```bash
curl --location 'https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id' \
  --header 'Authorization: Bearer PASTE_ACCESS_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --data '{
    "test": true
  }'
```

Replace `PASTE_ACCESS_TOKEN_HERE` with the actual token from Step 1.

---

### Expected Response (Success):

```json
{
  "ok": true,
  "device_code": "VS-001002",
  "device_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "created_at": "2024-11-13T10:30:45.123Z"
}
```

---

## Method 2: Quick Test via Browser Console

If curl is not available, use this JavaScript in browser console:

1. Open Supabase Dashboard in browser
2. Press F12 (Developer Tools)
3. Go to **Console** tab
4. Paste this code:

```javascript
// Step 1: Get token
const response = await fetch('https://oyqecdcpicvzwwvwaeka.supabase.co/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@vitalstep.com',
    password: 'Admin123!@#'
  })
});

const { access_token } = await response.json();
console.log('Token:', access_token);

// Step 2: Test function
const funcResponse = await fetch('https://oyqecdcpicvzwwvwaeka.supabase.co/functions/v1/generate-device-id', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ test: true })
});

const result = await funcResponse.json();
console.log('Result:', result);
```

5. Press Enter
6. Check console output

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Invalid credentials" | Check email/password are correct for admin user |
| "Not an authorized admin" | Admin user not added to `admins` table (run SQL to add) |
| "Invalid token" | Token format wrong - ensure it starts with `Bearer ` |
| 401 | Authorization header missing or malformed |

---

## Verify in Database

After successful test, check that device was created:

Go to Supabase → **SQL Editor** → Run:

```sql
SELECT device_code, device_secret, status, created_at 
FROM device_inventory 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see your newly generated device!

---

## Next Steps

Once function returns `"ok": true`, reply:
**"✅ Edge function working! Generated device: VS-XXXXX"**

Then I'll build the complete Next.js dashboard!
