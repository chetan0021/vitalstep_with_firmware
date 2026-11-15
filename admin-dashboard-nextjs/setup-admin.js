#!/usr/bin/env node
/**
 * One-time setup script to create an admin user in Supabase
 * Usage: node setup-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oyqecdcpicvzwwwaeka.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWVjZGNwaWN2end3d2Fla2EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjU0ODQ3MCwiZXhwIjoyMDQ4MTI0NDcwfQ.w9DfPbgNhp0J7JlzlQ3p5R5X8K0M3N2Q5S6V9W0X8Y1Z'
);

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupAdmin() {
  console.log('\n🔐 VitalStep Admin Setup');
  console.log('========================\n');

  const email = await question('Enter admin email (default: admin@vitalstep.com): ');
  const adminEmail = email.trim() || 'admin@vitalstep.com';

  const password = await question('Enter admin password: ');
  if (!password.trim()) {
    console.log('❌ Password cannot be empty');
    rl.close();
    process.exit(1);
  }

  try {
    console.log('\n📝 Creating admin user...');

    // First, check if email verification is needed
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: password.trim(),
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      console.log(`\n❌ Error: ${error.message}`);
      if (error.message.includes('already registered')) {
        console.log('   User already exists. Try logging in instead.');
      }
      rl.close();
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   UID: ${data.user?.id}`);
    console.log('\n🚀 You can now login to the admin dashboard.');
    console.log(`   URL: http://localhost:3000/login`);

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

setupAdmin();
