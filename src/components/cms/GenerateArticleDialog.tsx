'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Wand2, Lightbulb } from "lucide-react";
import { Textarea } from '../ui/textarea';
import { generateArticleOutline, generateArticleFromOutline } from '@/ai/genkit';
import { Card, CardContent } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Slider } from '../ui/slider';

// Define the type directly here for clarity
type Outline = {
    title: string;
    points: string[];
};

type Stage = 'description' | 'outline' | 'generating';

interface GenerateArticleDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onArticleGenerated: (content: string, title?: string) => void;
}

export function GenerateArticleDialog({ isOpen, onOpenChange, onArticleGenerated }: GenerateArticleDialogProps) {
    const { toast } = useToast();
    const [stage, setStage] = useState<Stage>('description');
    const [isLoading, setIsLoading] = useState(false);
    
    // Stage 1 state
    const [description, setDescription] = useState('');
    
    // Stage 2 state
    const [outlines, setOutlines] = useState<Outline[]>([]);
    const [selectedOutlineIndex, setSelectedOutlineIndex] = useState<number | null>(null);
    const [wordCount, setWordCount] = useState(500);

    const resetState = () => {
        setStage('description');
        setIsLoading(false);
        setDescription('');
        setOutlines([]);
        setSelectedOutlineIndex(null);
        setWordCount(500);
    }
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
        }
        onOpenChange(open);
    }

    const handleGenerateOutlines = async () => {
        if (!description.trim()) {
            toast({ variant: 'destructive', title: "Deskripsi tidak boleh kosong." });
            return;
        }
        setIsLoading(true);
        try {
            const result = await generateArticleOutline({ description });
            if (result && result.outlines.length > 0) {
                setOutlines(result.outlines);
                setStage('outline');
            } else {
                throw new Error("Gagal membuat kerangka artikel. AI mungkin tidak memberikan respons yang valid.");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Error AI", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateArticle = async () => {
        if (selectedOutlineIndex === null) {
            toast({ variant: 'destructive', title: "Pilih satu kerangka." });
            return;
        }
        setIsLoading(true);
        setStage('generating');
        try {
            const selectedOutline = outlines[selectedOutlineIndex];
            const result = await generateArticleFromOutline({ selectedOutline, wordCount });

            if (result && result.articleContent) {
                onArticleGenerated(result.articleContent, selectedOutline.title);
                handleOpenChange(false); // Close dialog on success
            } else {
                throw new Error("Gagal membuat artikel lengkap.");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Error AI", description: (error as Error).message });
             setStage('outline'); // Go back to outline selection on failure
        } finally {
            setIsLoading(false);
        }
    }

    const renderContent = () => {
        if (isLoading && stage === 'generating') {
            return (
                <div className="flex flex-col items-center justify-center text-center gap-4 h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <h3 className="font-semibold text-lg">AI sedang menulis artikel Anda...</h3>
                    <p className="text-muted-foreground">Ini mungkin memakan waktu hingga satu menit.</p>
                </div>
            );
        }

        switch (stage) {
            case 'description':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi atau Ide Artikel</Label>
                            <Textarea 
                                id="description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Contoh: 'Tuliskan artikel tentang manfaat teh hijau untuk kesehatan, target pembaca adalah pemula.'"
                                rows={5}
                            />
                        </div>
                    </div>
                );
            case 'outline':
                return (
                    <div className="space-y-4">
                         <h3 className="font-semibold text-lg">Pilih Kerangka Artikel</h3>
                         <RadioGroup onValueChange={(val) => setSelectedOutlineIndex(Number(val))}>
                            {outlines.map((outline, index) => (
                                <Label key={index} htmlFor={`outline-${index}`} className="block">
                                    <Card className="hover:border-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/50">
                                        <CardContent className="p-4 flex gap-3 items-start">
                                            <RadioGroupItem value={String(index)} id={`outline-${index}`} className="mt-1"/>
                                            <div className="flex-1">
                                                <h4 className="font-bold">{outline.title}</h4>
                                                <ul className="text-sm text-muted-foreground list-disc pl-4 mt-1">
                                                    {outline.points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Label>
                            ))}
                         </RadioGroup>
                         <div className='space-y-2 pt-4'>
                             <Label>Target Jumlah Kata: <span className="font-bold text-primary">{wordCount}</span></Label>
                             <Slider 
                                defaultValue={[wordCount]}
                                max={2000}
                                min={300}
                                step={50}
                                onValueChange={(value) => setWordCount(value[0])}
                             />
                         </div>
                    </div>
                );
            default: return null;
        }
    }

    const renderFooter = () => {
         if (isLoading) {
             return <DialogFooter><Button disabled><Loader2 className="animate-spin mr-2"/>Memproses...</Button></DialogFooter>;
         }
        
         switch(stage) {
             case 'description':
                 return <DialogFooter><Button onClick={handleGenerateOutlines} disabled={!description.trim()}>Lanjut: Buat Kerangka <Lightbulb className="ml-2"/></Button></DialogFooter>;
             case 'outline':
                 return <DialogFooter><Button onClick={handleGenerateArticle} disabled={selectedOutlineIndex === null}>Buat Artikel Lengkap <Wand2 className="ml-2"/></Button></DialogFooter>;
             default: return null;
         }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Generator Artikel AI</DialogTitle>
                    <DialogDescription>Jelaskan ide Anda, dan biarkan AI membantu menyusun tulisan yang menarik.</DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
                  {renderContent()}
                </div>
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
}
