import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin';

export async function getResendClient() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['resend_api_key']);
  const apiKey =
    data?.find((r) => r.key === 'resend_api_key')?.value ||
    process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

/** Resolve the from-address ("Name <email>") and email-toggle flags from settings. */
export async function getEmailConfig() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'resend_from_email',
      'resend_from_name',
      'send_order_emails',
      'send_notifyme_emails',
      'store_email',
    ]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value ?? '';
  const fromEmail = map.resend_from_email || 'orders@circuitkar.in';
  const fromName = map.resend_from_name || 'Circuitkar';
  return {
    from: `${fromName} <${fromEmail}>`,
    fromEmail,
    fromName,
    storeEmail: map.store_email || fromEmail,
    sendOrderEmails: map.send_order_emails !== 'false',
    sendNotifyMeEmails: map.send_notifyme_emails !== 'false',
  };
}
