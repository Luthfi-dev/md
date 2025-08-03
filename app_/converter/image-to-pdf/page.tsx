
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileImage, FileText, ArrowRightLeft, X } from 'lucide-react';
import { PDFDocument, PDFImage } from 'pdf-lib';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import { optimizeImage } from '@/lib/utils';

interface UploadedImage {
  file: File;
  url: string;
}

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<UploadedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setIsProcessing(true);
      const newImagesPromises = Array.from(selectedFiles)
        .filter(file => file.type.startsWith('image/'))
        .map(async file => {
          try {
            const optimizedFile = await optimizeImage(file, 1240); // Optimize for A4-like width
            return {
              file: optimizedFile,
              url: URL.createObjectURL(optimizedFile),
            };
          } catch (error) {
            console.error("Failed to optimize image:", file.name, error);
            toast({
              variant: 'destructive',
              title: `Gagal Memproses ${file.name}`,
              description: 'Gambar ini akan dilewati.',
            });
            return null;
          }
        });

      const newImages = (await Promise.all(newImagesPromises)).filter((img): img is UploadedImage => img !== null);
      
      if (newImages.length > 0) {
        setFiles(prev => [...prev, ...newImages]);
      } else if (files.length === 0) {
        toast({
          variant: 'destructive',
          title: 'File Tidak Valid',
          description: 'Silakan pilih file dengan format gambar (JPG, PNG, dll).',
        });
      }
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  const getTargetFilename = () => {
    const firstFileName = files.length > 0 ? files[0].file.name.substring(0, files[0].file.name.lastIndexOf('.')) : 'converted';
    return `${firstFileName}.pdf`;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak Ada File',
        description: 'Pilih setidaknya satu gambar untuk dikonversi.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const { file } of files) {
        const arrayBuffer = await file.arrayBuffer();
        let pdfImage: PDFImage;

        if (file.type === 'image/png') {
            pdfImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
            // Default to JPG for other types, as our optimizer outputs jpeg
            pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        }
        
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, getTargetFilename());

      toast({
        title: 'Konversi Berhasil!',
        description: `${files.length} gambar telah diubah menjadi PDF.`,
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal.';
      toast({
        variant: 'destructive',
        title: 'Kesalahan Konversi',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center gap-4 mb-4">
            <FileImage className="w-12 h-12 text-green-500" />
            <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
            <FileText className="w-12 h-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-headline">Gambar ke PDF</CardTitle>
          <CardDescription>Unggah satu atau lebih gambar untuk digabungkan menjadi satu file PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>File Gambar</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                 <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                   {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                   Pilih Gambar
                 </Button>
                 <Input ref={fileInputRef} id="file-upload" type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden"/>
                 <p className="text-xs text-muted-foreground mt-2">Gambar akan dioptimalkan secara otomatis.</p>
              </div>
              
              {files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Pratinjau Gambar:</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {files.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        <Image src={img.url} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing || files.length === 0}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konversi & Unduh Otomatis'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
