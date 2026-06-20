# Supabase Setup for Platform 2

Here are the copy-paste templates you need to provision the connection to the shared backend in your new project.

## 1. Environment Variables (`.env`)
Create an `.env` or `.env.local` file at the root of your new project. Paste the exact same keys you use in the main project.

```env
# Connects to the shared TMS database
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 2. The Supabase Client (`src/services/supabase-client.ts`)
Create this file in your new project. It initializes the connection and handles session persistence automatically.

> [!NOTE]
> If you are using plain JavaScript (`.js` instead of `.ts`), simply remove the `: SupabaseClient | null` type annotation and the `import { SupabaseClient }` statement.

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Fetch environment variables (Vite syntax)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || "").trim().replace(/\r?\n|\r/g, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || "").trim().replace(/\r?\n|\r/g, "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file."
  );
}

// Initialize and export the persistent client
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Keep the user logged in across page reloads
        detectSessionInUrl: false,
        lock: null 
      }
    })
  : null;
```

## 3. Example Service (`src/services/example-service.ts`)
Here is a boilerplate template for how you should write services in the new platform to interact with the database.

```typescript
import { supabase } from "./supabase-client";

/**
 * Example function to fetch data for the new platform
 */
export const getPlatformData = async () => {
  // Ensure the client is initialized
  if (!supabase) throw new Error("Supabase client is not initialized.");

  // Make the query. Note: RLS policies will still apply based on the logged-in user!
  const { data, error } = await supabase
    .from('your_table_name')
    .select('*')
    // Example: only fetch data relevant to this platform
    // .eq('platform_identifier', 'platform_2')
    .limit(50);
    
  if (error) {
    console.error("Database query failed:", error.message);
    throw error;
  }
  
  return data;
};
```

## Next Steps
1. Run `npm install @supabase/supabase-js` in your new project.
2. Copy the files above into your project structure.
3. Update your Supabase Dashboard API Settings to add your new platform's `localhost` port (e.g., `http://localhost:5174`) and its future production URL to the allowed CORS origins.
