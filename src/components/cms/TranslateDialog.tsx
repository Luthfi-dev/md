
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Languages, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TranslateDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (targetLanguage: string) => void;
  isLoading: boolean;
}

const languages = [
    { value: 'English', label: 'Inggris' },
    { value: 'Spanish', label: 'Spanyol' },
    { value: 'Japanese', label: 'Jepang' },
    { value: 'Arabic', label: 'Arab' },
    { value: 'Korean', label: 'Korea' },
];

export function TranslateDialog({ isOpen, onOpenChange, onConfirm, isLoading }: TranslateDialogProps) {
    const [targetLanguage, setTargetLanguage] = useState('English');

    const handleConfirm = () => {
        onConfirm(targetLanguage);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'><Languages /> Terjemahkan Konten</DialogTitle>
                    <DialogDescription>Pilih bahasa target untuk menerjemahkan konten Anda saat ini.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="language-select">Pilih Bahasa</Label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger id="language-select">
                            <SelectValue placeholder="Pilih bahasa" />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
                    <Button onClick={handleConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 animate-spin"/>}
                        Terjemahkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
