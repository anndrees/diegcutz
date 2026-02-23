import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QrScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QrScanner = ({ open, onOpenChange }: QrScannerProps) => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
    newCount?: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setTimeout(() => startScanner(), 500);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Stop scanning immediately after detection
          try { await scanner.stop(); } catch {}
          setScanning(false);
          handleQrResult(decodedText);
        },
        () => {} // ignore errors
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setScanning(false);
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQrResult = async (token: string) => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("scan-loyalty-qr", {
        body: { loyalty_token: token },
      });

      if (error) {
        setResult({ success: false, message: "Error al procesar el QR" });
        return;
      }

      if (data?.error) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({
          success: true,
          message: data.message || "¡Sello añadido!",
          userName: data.userName,
          newCount: data.newCount,
        });
      }
    } catch (err) {
      setResult({ success: false, message: "Error de conexión" });
    } finally {
      setProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    setTimeout(() => startScanner(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Escáner de Fidelización
          </DialogTitle>
          <DialogDescription>
            Escanea el QR del cliente para añadir un sello
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Scanner viewport */}
          {!result && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <div id="qr-reader" className="w-full" />
              {scanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-60 h-60 border-2 border-primary/50 rounded-xl animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {processing && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Procesando...</p>
            </div>
          )}

          {/* Result */}
          {result && !processing && (
            <div className="flex flex-col items-center gap-4 py-8">
              {result.success ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-500">¡Sello añadido!</p>
                    {result.userName && (
                      <p className="text-muted-foreground mt-1">
                        Cliente: <strong>{result.userName}</strong>
                      </p>
                    )}
                    {result.newCount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Sellos: {result.newCount % 10}/10
                        {result.newCount % 10 === 0 && result.newCount > 0 && (
                          <span className="block text-[#D4AF37] font-bold mt-1">
                            🎉 ¡Ha completado la tarjeta! Corte GRATIS desbloqueado
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-destructive" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-destructive">Error</p>
                    <p className="text-muted-foreground mt-1">{result.message}</p>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
                <Button variant="neon" onClick={handleScanAgain}>
                  <ScanLine className="w-4 h-4 mr-2" />
                  Escanear otro
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
