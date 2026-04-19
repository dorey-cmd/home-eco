import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onResult, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onResult(decodedText);
        scannerRef.current?.clear();
      },
      () => {
        // Ignored, scanning
      }
    );

    return () => {
      scannerRef.current?.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onResult]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)' }}>
        <button className="glass-button secondary" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white' }}>
          <X size={32} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div id="reader" style={{ width: '100%', maxWidth: '600px' }}></div>
      </div>
      <div style={{ padding: '32px', textAlign: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: '1.2rem', fontWeight: 'bold' }}>
        סורק ברקוד...
      </div>
    </div>
  );
};
