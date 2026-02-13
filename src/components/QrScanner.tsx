import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (code: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    setError(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Try back camera first, fall back to any available camera
      let cameraConfig: any = { facingMode: "environment" };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          cameraConfig = { deviceId: { exact: devices[0].id } };
        }
      } catch {}

      await scanner.start(
        cameraConfig,
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          // Extract session code from URL or raw text
          try {
            const url = new URL(decodedText);
            const code = url.searchParams.get("code");
            if (code) {
              onScan(code);
            }
          } catch {
            // Not a URL, try raw code
            if (decodedText.length >= 4) {
              onScan(decodedText.toUpperCase());
            }
          }
          stopScanner();
        },
        () => {} // ignore scan errors
      );
    } catch (err: any) {
      setError("Impossible d'accéder à la caméra");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (!scanning) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          className="h-14 w-full text-base font-bold rounded-xl border-2 border-primary/20 gap-2"
          onClick={startScanner}
        >
          <Camera className="w-5 h-5" />
          Scanner le QR Code
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black">
      <div id="qr-reader" className="w-full" />
      <button
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center"
        onClick={stopScanner}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
