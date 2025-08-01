import QRCode from 'qrcode';

export interface UPIQRData {
  upiId: string;
  payeeName?: string;
  amount: number;
  note?: string;
  merchantCode?: string;
}

export const generateUPIString = (data: UPIQRData): string => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('pa', data.upiId); // Payee Address (UPI ID)
  params.append('am', data.amount.toString()); // Amount
  
  // Optional parameters
  if (data.payeeName) {
    params.append('pn', data.payeeName); // Payee Name
  }
  
  if (data.note) {
    params.append('tn', data.note); // Transaction Note
  }
  
  params.append('cu', 'INR'); // Currency (always INR for India)
  
  if (data.merchantCode) {
    params.append('mc', data.merchantCode); // Merchant Code
  }
  
  // Generate UPI URL
  return `upi://pay?${params.toString()}`;
};

export const generateUPIQRCode = async (data: UPIQRData): Promise<string> => {
  try {
    const upiString = generateUPIString(data);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};