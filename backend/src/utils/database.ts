import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY'
  );
}

// Create and export Supabase client instance
// This client will be used throughout the application for database operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // We're not using Supabase auth for MVP
  },
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to test connection
    const { error } = await supabase.from('_test_').select('*').limit(1);
    
    // If table doesn't exist, that's fine - connection works
    // If connection fails, we'll get a different error
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.info('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

// Export database URL for logging (without sensitive key)
export function getDatabaseInfo(): { url: string; connected: boolean } {
  return {
    url: supabaseUrl || 'Not configured',
    connected: !!supabaseUrl && !!supabaseKey,
  };
}
