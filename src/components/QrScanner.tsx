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

    // Step 1: Explicitly request camera permission BEFORE html5-qrcode
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      // Stop the stream immediately — we just needed the permission grant
      stream.getTracks().forEach(track => track.stop());
    } catch (permErr: any) {
      setError("Autorisez l'accès à la caméra dans les paramètres de votre navigateur, puis réessayez.");
      return;
    }

    setScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const qrConfig = { fps: 10, qrbox: { width: 200, height: 200 } };
      const onSuccess = (decodedText: string) => {
        try {
          const url = new URL(decodedText);
          const code = url.searchParams.get("code");
          if (code) {
            onScan(code);
          }
        } catch {
          if (decodedText.length >= 4) {
            onScan(decodedText.toUpperCase());
          }
        }
        stopScanner();
      };
      const onError = () => {};

      // Now use getCameras (permission already granted, so this will work)
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        // Prefer back camera
        const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
        const camId = backCam ? backCam.id : devices[0].id;
        await scanner.start(camId, qrConfig, onSuccess, onError);
      } else {
        throw new Error("No camera found");
      }
    } catch (err: any) {
      setError("Impossible de démarrer la caméra. Essayez de fermer les autres apps utilisant la caméra.");
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
