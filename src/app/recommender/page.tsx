
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Upload, Trash2, Lightbulb, Sparkles, HelpCircle, X, Plus
} from 'lucide-react';
import Image from 'next/image';
import { getAiRecommendation } from '@/ai/genkit';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface UploadedImage {
    id: string;
    file: File;
    dataUri: string;
}

export default function RecommenderPage() {
    const { toast } = useToast();
    const [mainItem, setMainItem] = useState<UploadedImage | null>(null);
    const [choiceItems, setChoiceItems] = useState<UploadedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<{ bestChoiceIndex: number; reasoning: string; summary: string} | null>(null);

    const mainItemInputRef = useRef<HTMLInputElement>(null);
    const choiceItemsInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'main' | 'choice') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const processFile = (file: File) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage: UploadedImage = {
                    id: `${file.name}-${Date.now()}`,
                    file,
                    dataUri: event.target?.result as string,
                };
                if (type === 'main') {
                    setMainItem(newImage);
                } else {
                    setChoiceItems(prev => [...prev, newImage]);
                }
            };
            reader.readAsDataURL(file);
        };
        
        Array.from(files).forEach(processFile);
        e.target.value = ''; // Reset input
    };

    const removeImage = (id: string, type: 'main' | 'choice') => {
        if (type === 'main') {
            setMainItem(null);
        } else {
            setChoiceItems(prev => prev.filter(item => item.id !== id));
        }
    };
    
    const handleSubmit = async () => {
        if (!mainItem || choiceItems.length < 2) {
            toast({ variant: 'destructive', title: 'Input Kurang', description: 'Mohon unggah satu item utama dan setidaknya dua item pilihan.' });
            return;
        }
        
        setIsLoading(true);
        setRecommendation(null);
        
        try {
            const result = await getAiRecommendation({
                mainItem: { dataUri: mainItem.dataUri },
                choices: choiceItems.map(c => ({ dataUri: c.dataUri })),
            });
            
            if (result && typeof result.bestChoiceIndex === 'number') {
                setRecommendation(result);
                toast({ title: 'Rekomendasi Siap!', description: 'AI telah memilih pilihan terbaik untuk Anda.'});
            } else {
                throw new Error("AI tidak memberikan respons yang valid.");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Mendapatkan Rekomendasi', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <Card className="max-w-4xl mx-auto shadow-2xl">
                <CardHeader className="text-center">
                    <Lightbulb className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="text-3xl font-headline mt-2">Rekomendasi AI</CardTitle>
                    <CardDescription>Bingung memilih? Biarkan AI menjadi konsultan pribadi Anda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="w-full">
                                <HelpCircle className="mr-2"/> Cara Penggunaan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Panduan Rekomendasi AI</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p>1. **Unggah Item Utama:** Klik area "Item Utama" untuk mengunggah satu gambar acuan (contoh: kemeja).</p>
                                <p>2. **Unggah Pilihan:** Klik area "Pilihan Anda" untuk mengunggah dua atau lebih gambar pilihan (contoh: beberapa sepatu).</p>
                                <p>3. **Minta Rekomendasi:** Klik tombol "Minta Rekomendasi AI".</p>
                                <p>4. **Lihat Hasil:** AI akan menganalisis dan menyorot pilihan terbaik beserta alasan logisnya.</p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button>Mengerti!</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Main Item Upload */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg text-center">1. Unggah Item Utama</h3>
                            <div className="aspect-square w-full border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground p-2"
                                onClick={() => !mainItem && mainItemInputRef.current?.click()}
                            >
                                {mainItem ? (
                                    <div className="relative w-full h-full">
                                        <Image src={mainItem.dataUri} alt="Item Utama" layout="fill" className="object-contain rounded-md" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeImage(mainItem.id, 'main')}><X className="h-4 w-4"/></Button>
                                    </div>
                                ) : (
                                    <div className="text-center cursor-pointer">
                                        <Upload className="mx-auto h-10 w-10"/>
                                        <p className="mt-2 text-sm">Klik untuk memilih gambar</p>
                                    </div>
                                )}
                                <Input ref={mainItemInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'main')}/>
                            </div>
                        </div>

                        {/* Choice Items Upload */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg text-center">2. Unggah Pilihan Anda</h3>
                             <div className="grid grid-cols-2 gap-2">
                                {choiceItems.map(item => (
                                    <div key={item.id} className="relative aspect-square">
                                        <Image src={item.dataUri} alt="Pilihan" layout="fill" className="object-contain rounded-md bg-secondary/30 p-1" />
                                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(item.id, 'choice')}><X className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                {choiceItems.length < 4 && (
                                     <div className="aspect-square w-full border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer"
                                         onClick={() => choiceItemsInputRef.current?.click()}
                                     >
                                         <div className="text-center">
                                            <Plus className="mx-auto h-8 w-8"/>
                                            <p className="mt-1 text-xs">Tambah Pilihan</p>
                                        </div>
                                         <Input ref={choiceItemsInputRef} type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'choice')}/>
                                     </div>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    <Button size="lg" className="w-full text-lg" onClick={handleSubmit} disabled={isLoading || !mainItem || choiceItems.length < 2}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                        Minta Rekomendasi AI
                    </Button>

                    {recommendation && (
                        <Alert className="border-primary/50 shadow-lg">
                            <Sparkles className="h-5 w-5 text-primary"/>
                            <AlertTitle className="text-xl font-bold text-primary">{recommendation.summary}</AlertTitle>
                            <AlertDescription className="mt-4 space-y-4">
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                    {choiceItems.map((item, index) => (
                                         <div key={item.id} className={`relative aspect-square p-2 rounded-lg transition-all duration-300 ${index === recommendation.bestChoiceIndex ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/30'}`}>
                                            <Image src={item.dataUri} alt={`Pilihan ${index + 1}`} layout="fill" className="object-contain" />
                                        </div>
                                    ))}
                               </div>
                               <div>
                                   <h4 className="font-semibold">Alasan AI:</h4>
                                   <p>{recommendation.reasoning}</p>
                               </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
