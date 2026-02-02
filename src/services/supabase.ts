import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cbjkievjotcqmhzuolok.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamtpZXZqb3RjcW1oenVvbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTE3NDAsImV4cCI6MjA3NTUyNzc0MH0.W4x2lVhpntm1DreIzIE3vrp0J5wjOnKqoS3KZwQq9dY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
