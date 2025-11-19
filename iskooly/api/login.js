// api/login.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env keys');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Only POST allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ status:'error', message: 'Email and password required' });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, password, role')
      .eq('email', email)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = data[0];
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) {
      return res.json({ status: 'error', message: 'Invalid email or password' });
    }

    // success
    return res.json({ status: 'success', message: 'Login successful', name: user.name, role: user.role });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
}
