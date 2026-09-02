import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Ensure permission fields exist (for backward compatibility)
  return {
    ...profile,
    can_create_admin: profile.can_create_admin ?? false,
    can_approve_bookings: profile.can_approve_bookings ?? false,
    can_manage_rates: profile.can_manage_rates ?? false,
  };
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) throw new Error("Unauthorized");
  return profile;
}
