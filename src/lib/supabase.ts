import { createBrowserClient } from "@supabase/ssr";

let realClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a fresh mock each time — never cache it
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({
          data: null,
          error: { message: "Supabase not configured. Check your .env file." },
        }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        insert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as any;
  }

  if (!realClient) {
    realClient = createBrowserClient(url, key);
  }
  return realClient;
}
