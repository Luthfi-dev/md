
'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Sparkles, Upload, Copy, BrainCircuit, Mic,
    ChevronsRight, ChevronRight, PenLine, Languages, SlidersHorizontal
} from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { generateCreativeContent, lengthenArticle, shortenArticle, generateHeadlines } from '@/ai/genkit';
import { ScrollArea } from '@/components/ui/scroll-area';

type ActionLoadingState = {
    [key: string]: boolean;
};

export default function ContentCreatorPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<ActionLoadingState>({});

    const [promptText, setPromptText] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [style, setStyle] = useState('persuasif');
    const [generatedContent, setGeneratedContent] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

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
        
        try {
            const result = await generateCreativeContent({
                text: promptText,
                imageDataUri: uploadedImage,
                style,
            });
            if (result.content) {
                setGeneratedContent(result.content);
                if (editorRef.current) editorRef.current.innerHTML = result.content;
                toast({ title: "Konten Berhasil Dibuat!", description: "AI telah selesai menulis. Anda bisa menyempurnakannya." });
            } else {
                 throw new Error("AI tidak memberikan konten.");
            }
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Gagal Membuat Konten', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const runAction = async (actionName: 'lengthen' | 'shorten' | 'headlines', actionFn: (input: any) => Promise<any>) => {
        const currentContent = editorRef.current?.innerHTML || '';
        if (!currentContent.trim()) {
            toast({ variant: "destructive", title: "Konten Kosong", description: "Tidak ada konten untuk diproses." });
            return;
        }

        setActionLoading(prev => ({...prev, [actionName]: true}));
        try {
            const result = await actionFn({ content: currentContent });
            if (actionName === 'headlines') {
                 toast({
                    title: 'Judul Alternatif Dibuat',
                    description: (
                    <ul className="mt-2 w-full rounded-md bg-secondary p-4">
                        {result.headlines.map((h: string, i: number) => <li key={i} className="mb-1">💡 {h}</li>)}
                    </ul>
                    ),
                    duration: 10000,
                 });

            } else if (result.content) {
                setGeneratedContent(result.content);
                if (editorRef.current) editorRef.current.innerHTML = result.content;
                toast({ title: "Konten Berhasil Diperbarui!" });
            } else {
                throw new Error("AI tidak memberikan respons yang valid.");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: `Gagal ${actionName}`, description: (error as Error).message });
        } finally {
             setActionLoading(prev => ({...prev, [actionName]: false}));
        }
    }
    
    const copyContent = () => {
        const content = editorRef.current?.innerText || '';
        if(content) {
            navigator.clipboard.writeText(content);
            toast({ title: "Teks Konten Disalin!" });
        }
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
                                    <span className="flex-shrink mx-4 text-xs text-muted-foreground">ATAU</span>
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
                                                <p className="mt-1 text-sm">Klik untuk memilih</p>
                                            </div>
                                        )}
                                        <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                                    </div>
                                </div>
                                 <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="style-select">Gaya Bahasa</Label>
                                    <Select value={style} onValueChange={setStyle}>
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
                                <Button className="w-full" onClick={handleGenerate} disabled={isLoading || (!promptText.trim() && !uploadedImage)}>
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
                                <CardTitle className="flex items-center gap-2">Hasil AI</CardTitle>
                                <CardDescription>Konten yang dihasilkan akan muncul di sini. Anda bisa mengeditnya langsung.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                     <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                        <h3 className="text-lg font-semibold">AI sedang meracik kata-kata...</h3>
                                        <p className="text-muted-foreground">Ini mungkin butuh beberapa saat.</p>
                                    </div>
                                ) : (
                                     <div
                                        ref={editorRef}
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        className="prose dark:prose-invert max-w-none min-h-[400px] rounded-md border bg-background p-4 focus:outline-none focus:ring-2 focus:ring-primary"
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
                                <Button variant="outline" className="w-full justify-start" onClick={copyContent} disabled={!generatedContent || isLoading}>
                                    <Copy className="mr-2"/> Salin Teks Konten
                                </Button>
                                <Separator />
                                <Button variant="outline" className="w-full justify-start" onClick={() => runAction('lengthen', lengthenArticle)} disabled={!generatedContent || isLoading || actionLoading.lengthen}>
                                    {actionLoading.lengthen ? <Loader2 className="mr-2 animate-spin"/> : <ChevronsRight className="mr-2"/>} Perpanjang Teks
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => runAction('shorten', shortenArticle)} disabled={!generatedContent || isLoading || actionLoading.shorten}>
                                     {actionLoading.shorten ? <Loader2 className="mr-2 animate-spin"/> : <ChevronRight className="mr-2"/>} Ringkas Teks
                                </Button>
                                 <Separator />
                                <Button variant="outline" className="w-full justify-start" onClick={() => runAction('headlines', generateHeadlines)} disabled={!generatedContent || isLoading || actionLoading.headlines}>
                                     {actionLoading.headlines ? <Loader2 className="mr-2 animate-spin"/> : <BrainCircuit className="mr-2"/>} Buat Judul/Slogan
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled={!generatedContent || isLoading}>
                                    <Languages className="mr-2"/> Terjemahkan
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
