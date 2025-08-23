'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Sparkles, Trash2, LogIn, Briefcase } from 'lucide-react';
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
                    <Briefcase className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="text-3xl font-headline">Kalkulator Harga Proyek</CardTitle>
                    <CardDescription>Dapatkan estimasi biaya pengembangan proyek perangkat lunak Anda dengan AI berdasarkan data pasar di Indonesia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="project-title" className="text-lg font-semibold">Judul Proyek</Label>
                        <Input 
                            id="project-title" 
                            placeholder="Contoh: Aplikasi Toko Online, Sistem ERP, dll."
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            className="text-base"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Fitur-fitur Proyek</h3>
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
                                placeholder="Masukkan nama fitur (e.g., Autentikasi Pengguna)"
                                value={newFeatureName}
                                onChange={(e) => setNewFeatureName(e.target.value)}
                            />
                            <Button type="submit" disabled={!newFeatureName.trim()}>
                                <Plus />
                            </Button>
                        </form>
                    </div>

                    <Separator />

                    <div className="text-right">
                         <h3 className="text-lg font-semibold">Total Estimasi Harga</h3>
                         <p className="text-2xl font-bold text-primary">Rp {totalMin.toLocaleString('id-ID')} - Rp {totalMax.toLocaleString('id-ID')}</p>
                         <p className="text-xs text-muted-foreground">*Harga merupakan estimasi kasar dan dapat bervariasi.</p>
                    </div>

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
          <div className="relative w-full max-w-xs mx-auto mb-8">
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <Image
              data-ai-hint="planning project"
              src="https://placehold.co/600x400.png"
              alt="Project Estimation"
              width={600}
              height={400}
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Bingung Nentuin Budget Proyek?</h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
            Gunakan Kalkulator Harga Proyek berbasis AI kami untuk mendapatkan estimasi biaya pengembangan aplikasi atau website Anda secara instan. Cukup masukkan fitur-fitur yang Anda inginkan!
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
