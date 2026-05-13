
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfeulurppwynhqdbmkzb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZXVsdXJwcHd5bmhxZGJta3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODc1ODEsImV4cCI6MjA5NDA2MzU4MX0.I6uzPNuCmk3YK31f5jXUjGh5K2eNrL5SYpBOvZ4Cc3A';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  console.log('Attempting to setup admin account...');

  // 1. Sign up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'admin@admin',
    password: 'admin@admin',
  });

  let userId;
  if (authError) {
    if (authError.message.includes('User already registered')) {
      console.log('User already exists in Auth. Checking for profile...');
      // Try to get the user ID by signing in (since we have the password)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin',
        password: 'admin@admin',
      });
      if (signInError) {
        console.error('Error signing in to get ID:', signInError.message);
        return;
      }
      userId = signInData.user.id;
    } else {
      console.error('Auth Error:', authError.message);
      return;
    }
  } else {
    userId = authData.user.id;
    console.log('User created successfully:', userId);
  }

  // 2. Create/Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Admin',
      email: 'admin@admin',
      role: 'admin'
    });

  if (profileError) {
    console.error('Profile Error:', profileError.message);
  } else {
    console.log('Admin profile setup successfully!');
  }
}

setupAdmin();
