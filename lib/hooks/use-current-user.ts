"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

export function useCurrentUser() {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          if (mounted) setLoading(false);
          return;
        }
        const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).single();
        if (mounted) setUser(profile as AppUser);
      } catch {
        // Supabase não configurado neste ambiente
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
