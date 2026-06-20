const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Missing Supabase environment variables");
}

console.log("Supabase connected ✅");

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

module.exports = { supabase };