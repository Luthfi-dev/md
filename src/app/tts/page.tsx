
'use client';
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Sparkles, Volume2, Download, LogIn, Voicemail
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { textToSpeech, TtsInput } from '@/ai/genkit';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

const voices = [
    { name: 'Algenib', label: 'Wanita 1 (Tenang)' },
    { name: 'Antares', label: 'Pria 1 (Ramah)' },
    { name: 'Spica', label: 'Wanita 2 (Ceria)' },
    { name: 'Achernar', label: 'Pria 2 (Profesional)' },
    { name: 'Arcturus', label: 'Pria 3 (Dalam)' },
    { name: 'Regulus', label: 'Wanita 3 (Bersemangat)' },
];

const GUEST_CHAR_LIMIT = 50;
const USER_CHAR_LIMIT = 5000;

export default function TextToSpeechPage() {
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [text, setText] = useState('');
    const [voice, setVoice] = useState('Algenib');
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [characterCount, setCharacterCount] = useState(0);
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const charLimit = isAuthenticated ? USER_CHAR_LIMIT : GUEST_CHAR_LIMIT;

    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        let newText = e.target.value;
        if (newText.length > charLimit) {
            if (!isAuthenticated) {
                setIsLoginPromptOpen(true);
            }
            newText = newText.substring(0, charLimit);
        }
        setText(newText);
        setCharacterCount(newText.length);
    };
    
    const handleGenerate = async () => {
        if (!text.trim()) {
            toast({ variant: "destructive", title: "Teks Kosong", description: "Mohon masukkan teks yang ingin diubah menjadi suara." });
            return;
        }
        setIsLoading(true);
        setAudioSrc(null);
        
        try {
            const input: TtsInput = { text, voice };
            const result = await textToSpeech(input);

            if (result.media) {
                setAudioSrc(result.media);
                toast({ title: "Audio Berhasil Dibuat!", description: "Anda sekarang dapat memutar atau mengunduh hasilnya." });
            } else {
                 throw new Error("AI tidak menghasilkan audio.");
            }
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Gagal Membuat Audio', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!audioSrc) return;
        const link = document.createElement('a');
        link.href = audioSrc;
        link.download = `maudigi-tts-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    useEffect(() => {
        if(audioSrc && audioRef.current) {
            audioRef.current.play();
        }
    }, [audioSrc]);

    return (
        <>
            <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buka Potensi Penuh!</DialogTitle>
                        <DialogDescription>
                            Anda telah mencapai batas karakter untuk tamu. Login untuk mengubah hingga 5.000 karakter menjadi suara sekaligus!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsLoginPromptOpen(false)}>Nanti Saja</Button>
                         <Button asChild><Link href="/login">Login Sekarang <LogIn className="ml-2"/></Link></Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="container mx-auto px-4 py-8 pb-24">
                <Card className="max-w-2xl mx-auto shadow-2xl">
                    <CardHeader className="text-center">
                        <Voicemail className="w-12 h-12 mx-auto text-primary" />
                        <CardTitle className="text-3xl font-headline mt-2">AI Text to Speech</CardTitle>
                        <CardDescription>Ubah tulisan menjadi audio yang terdengar alami dengan kekuatan AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="tts-text">Teks Anda</Label>
                            <Textarea 
                                id="tts-text"
                                value={text}
                                onChange={handleTextChange}
                                placeholder="Ketik atau tempel teks Anda di sini..."
                                rows={8}
                                className="text-base"
                            />
                            <div className="text-xs text-muted-foreground text-right">
                                {characterCount} / {charLimit.toLocaleString('id-ID')} karakter
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-select">Pilih Suara</Label>
                            <Select value={voice} onValueChange={setVoice}>
                                <SelectTrigger id="voice-select">
                                    <SelectValue placeholder="Pilih gaya suara" />
                                </SelectTrigger>
                                <SelectContent>
                                    {voices.map(v => (
                                        <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full text-lg h-12" onClick={handleGenerate} disabled={isLoading || !text.trim()}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2"/>}
                            Buat Audio
                        </Button>
                        {audioSrc && (
                            <div className="p-4 bg-secondary rounded-lg space-y-4">
                                 <audio ref={audioRef} src={audioSrc} controls className="w-full"></audio>
                                 <Button variant="outline" className="w-full" onClick={handleDownload}>
                                    <Download className="mr-2" /> Unduh File .wav
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
