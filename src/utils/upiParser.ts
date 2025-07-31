export interface UPIData {
  upiId?: string;
  payeeName?: string;
  amount?: string;
  currency?: string;
  note?: string;
  merchantCode?: string;
}

export const parseUPIQR = (qrText: string): UPIData | null => {
  try {
    // UPI QR codes typically start with "upi://pay?" or are in URL format
    if (!qrText.toLowerCase().includes('upi://pay') && !qrText.toLowerCase().includes('pa=')) {
      return null;
    }

    const upiData: UPIData = {};

    // Handle both upi://pay? format and direct parameter format
    let paramString = '';
    if (qrText.startsWith('upi://pay?')) {
      paramString = qrText.substring(10); // Remove "upi://pay?"
    } else {
      paramString = qrText;
    }

    // Parse parameters
    const params = new URLSearchParams(paramString);

    // Extract UPI ID (pa = payee address)
    const upiId = params.get('pa');
    if (upiId) {
      upiData.upiId = upiId;
    }

    // Extract payee name (pn = payee name)
    const payeeName = params.get('pn');
    if (payeeName) {
      upiData.payeeName = payeeName;
    }

    // Extract amount (am = amount)
    const amount = params.get('am');
    if (amount) {
      upiData.amount = amount;
    }

    // Extract currency (cu = currency, default is INR)
    const currency = params.get('cu') || 'INR';
    upiData.currency = currency;

    // Extract note/description (tn = transaction note)
    const note = params.get('tn');
    if (note) {
      upiData.note = note;
    }

    // Extract merchant code (mc = merchant code)
    const merchantCode = params.get('mc');
    if (merchantCode) {
      upiData.merchantCode = merchantCode;
    }

    return upiData;
  } catch (error) {
    console.error('Error parsing UPI QR:', error);
    return null;
  }
};

export const isValidUPI = (upiData: UPIData): boolean => {
  return !!(upiData && upiData.upiId);
};