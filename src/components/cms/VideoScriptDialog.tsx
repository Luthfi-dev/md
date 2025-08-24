
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { convertHtmlToWord } from "@/ai/flows/file-converter";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from 'file-saver';
import { useState } from "react";

interface VideoScriptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  scriptContent: string;
  isLoading: boolean;
}

export function VideoScriptDialog({ isOpen, onOpenChange, scriptContent, isLoading }: VideoScriptDialogProps) {
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
             const response = await convertHtmlToWord({
                htmlContent: scriptContent,
                filename: 'naskah-video.docx'
            });
            if (response.docxDataUri) {
                saveAs(response.docxDataUri, 'naskah-video.docx');
                toast({ title: 'Berhasil!', description: 'Naskah video sedang diunduh.' });
            } else {
                throw new Error(response.error || 'Gagal mengonversi file di server.');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Gagal Mengunduh", description: (error as Error).message });
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Naskah Video</DialogTitle>
                    <DialogDescription>Berikut adalah naskah video yang dibuat oleh AI berdasarkan konten Anda.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
                  {isLoading ? (
                      <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
                  ) : (
                      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: scriptContent }} />
                  )}
                </div>
                <DialogFooter>
                    <Button onClick={handleDownload} disabled={isLoading || isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <FileDown className="mr-2"/>}
                        Unduh sebagai Word
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
