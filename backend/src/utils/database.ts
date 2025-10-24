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
    // Use Supabase's built-in health check
    // This queries the postgres version which always exists
    const { error } = await supabase.rpc('version');
    
    // If we can't call RPC, try a simpler approach
    if (error) {
      // Alternative: Check if we can access the schema
      const { error: schemaError } = await supabase
        .from('_health_check_')
        .select('*')
        .limit(0); // Don't actually fetch data
      
      // Table not found is OK - it means we connected successfully
      // Any other error means connection failed
      if (schemaError && schemaError.code !== 'PGRST116') {
        console.error('❌ Database connection failed:', schemaError.message);
        return false;
      }
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
