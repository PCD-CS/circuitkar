import { getSettings } from "@/lib/settings";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const settings = await getSettings();
  return (
    <HeaderClient
      announcementText={settings.announcement_text}
      announcementEnabled={settings.announcement_enabled === "true"}
    />
  );
}
