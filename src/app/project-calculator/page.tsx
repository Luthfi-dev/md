
'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Sparkles, Trash2, LogIn, BrainCircuit } from 'lucide-react';
import { estimateProjectFeature } from '@/ai/flows/project-estimator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface Feature {
  id: string;
  name: string;
  priceMin?: number;
  priceMax?: number;
  justification?: string;
  isEstimating: boolean;
}

const ProjectCalculatorContent = () => {
    const [projectTitle, setProjectTitle] = useState('Aplikasi Toko Online');
    const [features, setFeatures] = useState<Feature[]>([]);
    const [newFeatureName, setNewFeatureName] = useState('');
    const { toast } = useToast();
    const featureInputRef = useRef<HTMLInputElement>(null);

    const handleAddFeature = async (e: FormEvent) => {
        e.preventDefault();
        if (!newFeatureName.trim()) return;

        const newFeature: Feature = {
            id: `feature_${Date.now()}`,
            name: newFeatureName.trim(),
            isEstimating: true,
        };

        setFeatures(prev => [...prev, newFeature]);
        setNewFeatureName('');
        
        try {
            const result = await estimateProjectFeature({ 
                projectName: projectTitle, 
                featureDescription: newFeature.name 
            });

            setFeatures(prev => prev.map(f => f.id === newFeature.id ? {
                ...f,
                priceMin: result.priceMin,
                priceMax: result.priceMax,
                justification: result.justification,
                isEstimating: false
            } : f));

        } catch (error) {
             toast({ variant: 'destructive', title: 'Gagal Estimasi', description: (error as Error).message });
             // Remove feature if AI fails
             setFeatures(prev => prev.filter(f => f.id !== newFeature.id));
        }
    };
    
    const removeFeature = (id: string) => {
        setFeatures(prev => prev.filter(f => f.id !== id));
    };

    const totalMin = features.reduce((sum, f) => sum + (f.priceMin || 0), 0);
    const totalMax = features.reduce((sum, f) => sum + (f.priceMax || 0), 0);

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <Card className="max-w-3xl mx-auto shadow-2xl">
                <CardHeader className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="text-3xl font-headline">Kalkulator Estimasi Proyek</CardTitle>
                    <CardDescription>Dapatkan estimasi biaya untuk ide atau proyek Anda dengan cepat menggunakan AI, berdasarkan data pasar di Indonesia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="project-title" className="text-lg font-semibold">Nama Proyek atau Ide</Label>
                        <Input 
                            id="project-title" 
                            placeholder="Contoh: Aplikasi Toko Online, Jasa Desain Logo, dll."
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="text-base"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Rincian & Fitur Proyek</h3>
                        <div className="space-y-3">
                            {features.map(feature => (
                                <Card key={feature.id} className="p-4 bg-secondary/50">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold">{feature.name}</p>
                                            {feature.isEstimating ? (
                                                <div className="flex items-center text-sm text-muted-foreground gap-2 mt-1">
                                                    <Loader2 className="w-4 h-4 animate-spin"/> Menghitung estimasi...
                                                </div>
                                            ) : (
                                                <>
                                                 <p className="text-sm font-bold text-primary">
                                                    Rp {feature.priceMin?.toLocaleString('id-ID')} - Rp {feature.priceMax?.toLocaleString('id-ID')}
                                                 </p>
                                                 <p className="text-xs text-muted-foreground mt-1">{feature.justification}</p>
                                                </>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeFeature(feature.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <form onSubmit={handleAddFeature} className="flex gap-2">
                            <Input 
                                ref={featureInputRef}
                                placeholder="Masukkan fitur atau rincian pekerjaan..."
                                value={newFeatureName}
                                onChange={(e) => setNewFeatureName(e.target.value)}
                            />
                            <Button type="submit" disabled={!newFeatureName.trim()}>
                                <Plus />
                            </Button>
                        </form>
                    </div>

                    {features.length > 0 && (
                        <>
                            <Separator />
                            <div className="text-right">
                                <h3 className="text-lg font-semibold">Total Estimasi Harga</h3>
                                <p className="text-2xl font-bold text-primary">Rp {totalMin.toLocaleString('id-ID')} - Rp {totalMax.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-muted-foreground">*Harga merupakan estimasi kasar dan dapat bervariasi.</p>
                            </div>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

const LoggedOutView = () => {
    const router = useRouter();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-primary/10 p-4 text-center">
        <div className="max-w-2xl">
           <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
             <BrainCircuit className="w-12 h-12 text-primary" />
           </div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Bingung Menentukan Anggaran Ide Anda?</h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
            Gunakan Kalkulator Estimasi Proyek berbasis AI kami untuk mendapatkan gambaran biaya untuk proyek atau ide apapun secara instan. Cukup masukkan rincian pekerjaan yang Anda inginkan!
          </p>
          <Button size="lg" className="mt-8" onClick={() => router.push('/login')}>
            <LogIn className="mr-2" /> Login & Coba Sekarang
          </Button>
        </div>
      </div>
    );
};


export default function ProjectCalculatorPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    
    if (isAuthLoading || isAuthenticated === undefined) {
        return <LoadingOverlay isLoading={true} message="Memeriksa sesi Anda..." />;
    }

    if (!isAuthenticated) {
        return <LoggedOutView />;
    }

    return <ProjectCalculatorContent />;
}
