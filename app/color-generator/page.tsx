
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Palette, Copy, Lock, Unlock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';


interface Color {
  hex: string;
  isLocked: boolean;
}

export default function ColorGeneratorPage() {
  const [palette, setPalette] = useState<Color[]>([]);
  const { toast } = useToast();

  const generateRandomHex = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  const generatePalette = useCallback(() => {
    setPalette(prevPalette => {
      if (prevPalette.length === 0) {
        return Array.from({ length: 5 }, () => ({
          hex: generateRandomHex(),
          isLocked: false,
        }));
      }
      return prevPalette.map(color => 
        color.isLocked ? color : { ...color, hex: generateRandomHex() }
      );
    });
  }, []);

  useEffect(() => {
    generatePalette();
  }, [generatePalette]);

  useEffect(() => {
    const handleSpaceBar = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        generatePalette();
      }
    };
    window.addEventListener('keydown', handleSpaceBar);
    return () => {
      window.removeEventListener('keydown', handleSpaceBar);
    };
  }, [generatePalette]);

  const toggleLock = (index: number) => {
    setPalette(prevPalette =>
      prevPalette.map((color, i) =>
        i === index ? { ...color, isLocked: !color.isLocked } : color
      )
    );
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({
      title: 'Warna Disalin!',
      description: `Kode warna ${hex} telah disalin ke clipboard.`,
    });
  };

  const getTextColor = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'text-black' : 'text-white';
  };

  return (
    <div className="container mx-auto px-2 py-8 pb-24">
      <Card className="max-w-4xl mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center">
          <div className='flex items-center justify-center gap-2'>
              <Palette className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl font-headline">Generator Palet Warna</CardTitle>
          </div>
          <CardDescription>Tekan spasi untuk membuat palet baru. Kunci warna favoritmu!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row h-[50vh] min-h-[400px] w-full rounded-2xl overflow-hidden mb-6 shadow-inner">
            {palette.map((color, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-center p-4 relative transition-all duration-300"
                style={{ backgroundColor: color.hex }}
              >
                <div className={cn("text-center space-y-4", getTextColor(color.hex))}>
                    <h2 
                        className="text-2xl font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => copyToClipboard(color.hex)}
                    >
                        {color.hex}
                    </h2>
                    <div className='flex gap-2'>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-white/20 hover:bg-white/40"
                            onClick={() => copyToClipboard(color.hex)}
                            >
                            <Copy className={cn("w-5 h-5", getTextColor(color.hex))} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-white/20 hover:bg-white/40"
                            onClick={() => toggleLock(index)}
                        >
                            {color.isLocked ? <Lock className={cn("w-5 h-5", getTextColor(color.hex))} /> : <Unlock className={cn("w-5 h-5", getTextColor(color.hex))} />}
                        </Button>
                    </div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={generatePalette} className="w-full h-12 text-lg rounded-full">
            <RefreshCw className="mr-2 h-5 w-5"/>
            Buat Palet Baru
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
