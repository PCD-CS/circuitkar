import { getSettings } from "@/lib/settings";
import { ContactClient } from "./ContactClient";

export default async function ContactPage() {
  const settings = await getSettings();
  return <ContactClient whatsappNumber={settings.whatsapp_number} />;
}
