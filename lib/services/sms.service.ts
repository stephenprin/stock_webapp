import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
const useWhatsApp = process.env.USE_WHATSAPP === "true";

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export interface SendSMSOptions {
  to: string;
  message: string;
  useWhatsApp?: boolean;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}


export async function sendSMS({
  to,
  message,
  useWhatsApp: forceWhatsApp,
}: SendSMSOptions): Promise<SMSResult> {
  if (!twilioClient) {
    console.error("[SMS] Twilio client not initialized. Check environment variables.");
    return {
      success: false,
      error: "SMS service not configured",
    };
  }

  const shouldUseWhatsApp = forceWhatsApp !== undefined ? forceWhatsApp : useWhatsApp;
  let fromNumber = shouldUseWhatsApp ? whatsappFromNumber : fromPhoneNumber;

  if (!fromNumber) {
    console.error(`[SMS] ${shouldUseWhatsApp ? 'WhatsApp' : 'SMS'} phone number not configured.`);
    return {
      success: false,
      error: `${shouldUseWhatsApp ? 'WhatsApp' : 'SMS'} phone number not configured`,
    };
  }

  if (shouldUseWhatsApp && !fromNumber.startsWith("whatsapp:")) {
    fromNumber = `whatsapp:${fromNumber}`;
  }

  if (!to || !message) {
    return {
      success: false,
      error: "Recipient phone number and message are required",
    };
  }

  try {
    const formattedTo = shouldUseWhatsApp && !to.startsWith("whatsapp:") 
      ? `whatsapp:${to}` 
      : to;

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo,
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error(`[${shouldUseWhatsApp ? 'WhatsApp' : 'SMS'}] Failed to send message to ${to}:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : `Failed to send ${shouldUseWhatsApp ? 'WhatsApp' : 'SMS'} message`,
    };
  }
}

export async function sendPriceAlertSMS({
  phoneNumber,
  symbol,
  company,
  currentPrice,
  targetPrice,
  alertType,
  useWhatsApp,
}: {
  phoneNumber: string;
  symbol: string;
  company: string;
  currentPrice: number;
  targetPrice: number;
  alertType: "upper" | "lower";
  useWhatsApp?: boolean;
}): Promise<SMSResult> {
  const alertEmoji = alertType === "upper" ? "📈" : "📉";
  const alertDirection = alertType === "upper" ? "above" : "below";
  
  const message = `${alertEmoji} Price Alert: ${symbol} (${company}) is ${alertDirection} your target price of $${targetPrice.toFixed(2)}. Current price: $${currentPrice.toFixed(2)}. View: http://localhost:3000/search?symbol=${symbol}`;

  return sendSMS({
    to: phoneNumber,
    message,
    useWhatsApp,
  });
}

export async function sendBulkSMS(
  messages: SendSMSOptions[]
): Promise<SMSResult[]> {
  return Promise.allSettled(
    messages.map((msg) => sendSMS(msg))
  ).then((results) =>
    results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            success: false,
            error: result.reason?.message || "Unknown error",
          }
    )
  );
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = "+1"): string {
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }
  
  return `${defaultCountryCode}${cleaned}`;
}

