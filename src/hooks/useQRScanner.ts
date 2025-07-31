import { useState, useRef, useCallback, useEffect } from 'react';
import QrScanner from 'qr-scanner';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = useCallback(async (onResult: (result: string) => void) => {
    try {
      setIsScanning(true);
      setError(null);

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Check if QR Scanner is supported
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera available');
      }

      // Create QR Scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          onResult(result.data);
          stopScanning();
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      // Start scanning
      await qrScannerRef.current.start();
      
      console.log('QR Scanner started successfully');
    } catch (err: any) {
      console.error('Failed to start QR scanner:', err);
      setError(err.message || 'Failed to start camera');
      setIsScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    try {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
      setIsScanning(false);
      setError(null);
    } catch (err: any) {
      console.error('Error stopping scanner:', err);
      setError(err.message || 'Error stopping scanner');
    }
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    videoRef
  };
};