import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("perfiles_admin")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}
