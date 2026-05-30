// SMS OTP stub — replace with Twilio/MSG91 when ready
export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  console.log(`[SMS STUB] Sending OTP ${otp} to ${phone}`);
}
