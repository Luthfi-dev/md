
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Camera, Copy, Trash2, Zap, ZapOff, SwitchCamera, HelpCircle, X, ZoomIn
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import jsQR from 'jsqr';
import 'webrtc-adapter';
import { Label } from '@/components/ui/label';


interface ScannedItem {
  id: number;
  data: string;
  timestamp: string;
}

export default function ScannerPage() {
  const [scannedHistory, setScannedHistory] = useState<ScannedItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeDetectorRef = useRef<any | null>(null);
  const beepAudioRef = useRef<AudioContext | null>(null);
  
  const initializeBeep = () => {
    if (typeof window !== 'undefined' && !beepAudioRef.current) {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            beepAudioRef.current = new AudioContext();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
        }
    }
  };

  const playBeep = useCallback(() => {
    if (!beepAudioRef.current) return;
    const oscillator = beepAudioRef.current.createOscillator();
    const gainNode = beepAudioRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, beepAudioRef.current.currentTime); 
    gainNode.gain.setValueAtTime(0.5, beepAudioRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, beepAudioRef.current.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(beepAudioRef.current.destination);
    
    oscillator.start();
    oscillator.stop(beepAudioRef.current.currentTime + 0.1);
  }, []);

  useEffect(() => {
    const initializeBarcodeDetector = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
          if (Array.isArray(supportedFormats) && supportedFormats.includes('qr_code') && supportedFormats.includes('code_128')) {
             barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'upc_a'] });
          }
        } catch (e) {
          console.error('Barcode Detector could not be initialized:', e);
        }
      }
    };
    
    initializeBarcodeDetector();
  }, []);
  
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsFlashOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          zoom: true,
          focusMode: 'continuous'
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play failed:", e));
        }
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera permission error:", err);
      setHasPermission(false);
      setIsCameraActive(false);
      toast({
        variant: 'destructive',
        title: 'Izin Kamera Diperlukan',
        description: 'Pastikan tidak digunakan aplikasi lain dan berikan izin kamera di pengaturan browser.',
      });
    }
  }, [facingMode, stopCamera, toast]);
  
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isCameraActive, startCamera, stopCamera]);

  const handleScanResult = useCallback((result: string) => {
    playBeep();
    setIsCooldown(true);

    const newScan: ScannedItem = { 
        id: Date.now(), 
        data: result,
        timestamp: new Date().toISOString()
    };
    setScannedHistory(prevHistory => [newScan, ...prevHistory]);
    
    toast({
      title: 'Pemindaian Berhasil',
      description: 'Data telah ditambahkan ke riwayat.',
    });

    setIsCameraActive(false);
    
    setTimeout(() => setIsCooldown(false), 2000);
  }, [playBeep, toast]);
  
  const scanFrame = useCallback(async () => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 3 || isCooldown) {
        if(isCameraActive) requestAnimationFrame(scanFrame);
        return;
    }
  
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
        if(isCameraActive) requestAnimationFrame(scanFrame);
        return;
    }
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
        if(isCameraActive) requestAnimationFrame(scanFrame);
        return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const isAlreadyScanned = (data: string) => scannedHistory.some(item => item.data === data);

    // QR Code Scan
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data && !isAlreadyScanned(code.data)) {
      handleScanResult(code.data);
      if(isCameraActive) requestAnimationFrame(scanFrame);
      return;
    }
  
    // Barcode Scan
    if (barcodeDetectorRef.current) {
      try {
        const barcodes = await barcodeDetectorRef.current.detect(imageData);
        if (barcodes.length > 0 && barcodes[0].rawValue && !isAlreadyScanned(barcodes[0].rawValue)) {
          handleScanResult(barcodes[0].rawValue);
           if(isCameraActive) requestAnimationFrame(scanFrame);
           return;
        }
      } catch (e) {
          // BarcodeDetector may fail silently
      }
    }
    
    if(isCameraActive) requestAnimationFrame(scanFrame);
  }, [isCameraActive, isCooldown, handleScanResult, scannedHistory]);
  
  useEffect(() => {
    let animationFrameId: number;
    if (isCameraActive && !isCooldown) {
        const runScan = () => {
            scanFrame();
        };
        animationFrameId = requestAnimationFrame(runScan);
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCameraActive, scanFrame, isCooldown]);


  const copyToClipboard = (text: string, singleItem: boolean = false) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Berhasil Disalin!',
      description: singleItem ? 'Data pindaian disalin.' : 'Semua data pindaian disalin.',
    });
  };

  const deleteItem = (id: number) => {
    setScannedHistory(prevHistory => prevHistory.filter(item => item.id !== id));
  };
  
  const copyAll = () => {
    if (scannedHistory.length === 0) return;
    const allData = scannedHistory.map(item => item.data).join('\n');
    copyToClipboard(allData, false);
  }

  const clearAllHistory = () => {
    setScannedHistory([]);
  };
  
  const handleStartScanClick = () => {
    initializeBeep();
    setIsCameraActive(prev => !prev)
  }

  const toggleFacingMode = () => {
    setIsFlashOn(false);
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleFlash = async () => {
     if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        // @ts-ignore
        if (capabilities.torch) {
            try {
                const newFlashState = !isFlashOn;
                // @ts-ignore
                await track.applyConstraints({ advanced: [{ torch: newFlashState }] });
                setIsFlashOn(newFlashState);
            } catch (error) {
                console.error("Gagal menyalakan flash:", error);
                toast({ variant: "destructive", title: "Flash Error", description: "Tidak dapat mengaktifkan flash."});
            }
        } else {
            toast({ variant: "destructive", title: "Flash Tidak Didukung", description: "Perangkat ini tidak mendukung kontrol flash."});
        }
    }
  }

  const handleZoom = (value: number[]) => {
    if(streamRef.current) {
       const track = streamRef.current.getVideoTracks()[0];
       // @ts-ignore
       const capabilities = track.getCapabilities();
       // @ts-ignore
       if (capabilities.zoom) {
          // @ts-ignore
          track.applyConstraints({ advanced: [{ zoom: value[0] }] });
       }
    }
  }
  
  const renderScanner = () => {
    if (!isCameraActive) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-4 text-white bg-gray-900 h-full">
          <Camera className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold">Kamera Tidak Aktif</h3>
          <p className="text-gray-400 text-sm mt-1">Klik tombol di bawah untuk memulai pemindaian.</p>
        </div>
      );
    }
    
    if (hasPermission === false) {
      return (
         <div className="p-4 h-full flex items-center justify-center">
            <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Izin Kamera Diperlukan</AlertTitle>
                <AlertDescription>
                   Aplikasi ini memerlukan izin kamera. Silakan aktifkan di pengaturan browser Anda.
                </AlertDescription>
            </Alert>
         </div>
      );
    }
    
    return (
      <div className='w-full h-full relative'>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 border-[20px] border-black/30 shadow-[0_0_0_2000px_rgba(0,0,0,0.3)] rounded-2xl pointer-events-none" />
        <div className="absolute w-2/3 max-w-[300px] aspect-square top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <div className="w-full h-full border-4 border-white/80 rounded-2xl animate-pulse" />
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white bg-black/50 hover:bg-white/20 hover:text-white" onClick={toggleFlash}>
            {isFlashOn ? <ZapOff /> : <Zap />}
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white bg-black/50 hover:bg-white/20 hover:text-white" onClick={toggleFacingMode}>
            <SwitchCamera />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card className="max-w-2xl mx-auto overflow-hidden shadow-xl rounded-2xl">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Pemindai Cerdas</CardTitle>
            <CardDescription>Arahkan kamera ke kode untuk memindai.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <HelpCircle className="mr-2"/> Cara Penggunaan
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl shadow-2xl">
                  <DialogHeader>
                  <DialogTitle className="text-xl text-center font-bold">Panduan Penggunaan Pemindai</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground pt-2">
                      <p className="flex items-start gap-3"><Camera className="w-6 h-6 text-primary shrink-0 mt-0.5"/> <span>Arahkan kamera Anda ke QR Code atau Barcode. Pemindaian akan terjadi secara otomatis ketika kode terdeteksi dengan jelas.</span></p>
                      <p className="flex items-start gap-3"><ZoomIn className="w-6 h-6 text-primary shrink-0 mt-0.5"/><span>Gunakan **slider zoom** untuk memperbesar atau memperkecil tampilan jika kode terlalu kecil atau jauh.</span></p>
                      <p className="flex items-start gap-3"><Zap className="w-6 h-6 text-primary shrink-0 mt-0.5"/><span>Gunakan ikon **Flash** untuk menyalakan lampu senter perangkat dalam kondisi gelap agar pemindaian lebih mudah.</span></p>
                      <p className="flex items-start gap-3"><SwitchCamera className="w-6 h-6 text-primary shrink-0 mt-0.5"/><span>Gunakan ikon **Ganti Kamera** untuk beralih antara kamera depan dan belakang sesuai kebutuhan Anda.</span></p>
                      <p className="flex items-start gap-3"><Copy className="w-6 h-6 text-primary shrink-0 mt-0.5"/><span>Setiap hasil pindaian akan muncul di riwayat. Anda dapat **menyalin** satu per satu atau **menyalin semua** hasil sekaligus dengan pemisah baris baru.</span></p>
                  </div>
                  <DialogClose asChild>
                      <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full h-8 w-8">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Tutup</span>
                    </Button>
                  </DialogClose>
              </DialogContent>
            </Dialog>

          <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
             {renderScanner()}
          </div>
          
          <Button onClick={handleStartScanClick} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            {isCameraActive ? 'Hentikan Pindai' : 'Mulai Pindai'}
          </Button>

          <div className='space-y-2'>
              <Label htmlFor="zoom-slider">Zoom</Label>
              <Slider 
                id="zoom-slider"
                defaultValue={[1]} 
                min={1} 
                // @ts-ignore
                max={streamRef.current?.getVideoTracks()[0]?.getCapabilities()?.zoom?.max ?? 10} 
                step={0.1} 
                onValueChange={handleZoom}
                disabled={!isCameraActive}
              />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Riwayat Pindaian</h3>
          </div>
          
           <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {scannedHistory.length > 0 ? (
              scannedHistory.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                  <p className="truncate text-sm flex-1 mr-4">{item.data}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(item.data, true)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center text-sm py-4">Belum ada pindaian. Klik "Mulai Pindai" untuk memulai.</p>
            )}
          </div>
          
           {scannedHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button onClick={copyAll} className="w-full">
                      <Copy className="mr-2 h-4 w-4" /> Copy All
                  </Button>
                   <Button onClick={clearAllHistory} className="w-full" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear All
                  </Button>
                </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
