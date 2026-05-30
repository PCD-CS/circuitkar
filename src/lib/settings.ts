import { createAdminClient } from "@/lib/supabase/admin";
import type { SettingsMap } from "@/types";

const DEFAULTS: SettingsMap = {
  site_name: "Circuitkar",
  announcement_text:
    "🚀 Launching Soon — Click 'Notify Me' on products you want!",
  announcement_enabled: "true",
  free_shipping_threshold: "499",
  razorpay_live: "false",
  admin_email: "",
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX",
};

/** Fetch all settings as a key->value map. Falls back to defaults. */
export async function getSettings(): Promise<SettingsMap> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error || !data) return { ...DEFAULTS };
    const map: SettingsMap = { ...DEFAULTS };
    for (const row of data) {
      if (row.value !== null) map[row.key] = row.value;
    }
    return map;
  } catch {
    return { ...DEFAULTS };
  }
}
