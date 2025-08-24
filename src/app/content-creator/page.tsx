
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Sparkles, Upload, Image as ImageIcon, Copy, BrainCircuit, Mic,
    ChevronsRight, ChevronRight, PenLine, Languages, SlidersHorizontal, Info, Bot
} from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function ContentCreatorPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [promptText, setPromptText] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!promptText && !uploadedImage) {
            toast({ variant: "destructive", title: "Input Kosong", description: "Mohon masukkan deskripsi atau unggah gambar." });
            return;
        }
        setIsLoading(true);
        setGeneratedContent('');
        
        // Simulate AI generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const exampleContent = `
            <h2>✨ Hadirkan Keajaiban di Setiap Gigitan: Donat Pelangi Ceria! ✨</h2>
            <p>Bosan dengan yang biasa? Saatnya mencoba sensasi rasa dan warna dari Donat Pelangi kami! Dibuat dengan adonan lembut premium dan topping glasir manis yang meleleh di mulut, setiap gigitan adalah petualangan baru.</p>
            <p><strong>Kenapa harus Donat Pelangi?</strong></p>
            <ul>
                <li><strong>Instagrammable Banget:</strong> Warna-warni ceria yang siap menghiasi feed media sosialmu.</li>
                <li><strong>Rasa Juara:</strong> Bukan cuma cantik, rasanya juga bikin nagih!</li>
                <li><strong>Fresh from the Oven:</strong> Dibuat setiap hari untuk menjamin kualitas terbaik.</li>
            </ul>
            <p>Sempurna untuk menemani pagimu, jadi cemilan sore, atau hadiah spesial untuk orang tersayang. Yuk, warnai harimu! 🌈</p>
            <p>#DonatPelangi #DonatEnak #CemilanHits #KulinerViral #JajananKekinian</p>
        `;
        setGeneratedContent(exampleContent);
        
        setIsLoading(false);
        toast({ title: "Konten Berhasil Dibuat!", description: "AI telah selesai menulis. Anda bisa menyempurnakannya." });
    };

    return (
        <div className="min-h-screen bg-secondary/20">
            <div className="container mx-auto px-4 py-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* --- KOLOM INPUT (KIRI) --- */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <Card className="sticky top-8 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><SlidersHorizontal /> Panel Kontrol AI</CardTitle>
                                <CardDescription>Jelaskan produk atau ide Anda di sini.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prompt-text">Deskripsi Produk/Ide</Label>
                                    <Textarea id="prompt-text" value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Contoh: donat empuk dengan topping meses pelangi..." rows={5} />
                                </div>
                                <div className="relative flex items-center justify-center my-4">
                                    <div className="flex-grow border-t"></div>
                                    <span className="flex-shrink mx-4 text-muted-foreground text-xs">ATAU</span>
                                    <div className="flex-grow border-t"></div>
                                </div>
                                <div className="space-y-2">
                                     <Label>Unggah Gambar Referensi</Label>
                                     <div 
                                        className="aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploadedImage ? (
                                            <Image src={uploadedImage} alt="Uploaded preview" width={200} height={112} className="object-cover w-full h-full rounded-md"/>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="mx-auto h-8 w-8"/>
                                                <p className="text-sm mt-1">Klik untuk memilih</p>
                                            </div>
                                        )}
                                        <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                                    </div>
                                </div>
                                 <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="style-select">Gaya Bahasa</Label>
                                    <Select defaultValue="persuasif">
                                        <SelectTrigger id="style-select">
                                            <SelectValue placeholder="Pilih gaya bahasa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="profesional">Profesional</SelectItem>
                                            <SelectItem value="santai">Santai & Akrab</SelectItem>
                                            <SelectItem value="jenaka">Jenaka & Kreatif</SelectItem>
                                            <SelectItem value="persuasif">Persuasif & Menjual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full" onClick={handleGenerate} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2"/>}
                                    Buat Konten
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- KOLOM EDITOR (TENGAH) --- */}
                    <div className="lg:col-span-5 xl:col-span-6">
                         <Card className="shadow-lg min-h-[70vh]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Bot /> Hasil AI</CardTitle>
                                <CardDescription>Konten yang dihasilkan akan muncul di sini. Anda bisa mengeditnya langsung.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                     <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
                                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                        <h3 className="font-semibold text-lg">AI sedang meracik kata-kata...</h3>
                                        <p className="text-muted-foreground">Ini mungkin butuh beberapa saat.</p>
                                    </div>
                                ) : (
                                     <div
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        className="prose dark:prose-invert max-w-none min-h-[400px] rounded-md border p-4 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                        dangerouslySetInnerHTML={{ __html: generatedContent || '<p class="text-muted-foreground">Konten Anda akan muncul di sini...</p>' }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- KOLOM AKSI (KANAN) --- */}
                    <div className="lg:col-span-3 xl:col-span-3">
                         <Card className="sticky top-8 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PenLine /> Panel Aksi</CardTitle>
                                <CardDescription>Gunakan alat bantu AI untuk menyempurnakan konten.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <Copy className="mr-2"/> Salin Konten
                                </Button>
                                <Separator />
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <ChevronsRight className="mr-2"/> Perpanjang Teks
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <ChevronRight className="mr-2"/> Ringkas Teks
                                </Button>
                                 <Separator />
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <Languages className="mr-2"/> Terjemahkan
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <BrainCircuit className="mr-2"/> Buat Judul/Slogan
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <Mic className="mr-2"/> Ubah Jadi Naskah Video
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
