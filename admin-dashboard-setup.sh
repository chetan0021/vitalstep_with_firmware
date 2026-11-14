#!/bin/bash

# VitalStep Admin Dashboard - Setup Script
# This creates the complete Next.js project structure

echo "🏭 Creating VitalStep Admin Dashboard..."
echo ""

# Create Next.js app
npx create-next-app@latest vitalstep-admin-dashboard \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias '@/*' \
  --skip-git

cd vitalstep-admin-dashboard

# Install dependencies
npm install @supabase/supabase-js zustand next-auth jose crypto-js
npm install -D @types/node @types/react

echo ""
echo "✅ Next.js project created!"
echo ""
echo "Next steps:"
echo "1. Copy environment variables to .env.local"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000"
