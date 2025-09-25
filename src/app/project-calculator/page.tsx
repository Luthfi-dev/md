
'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Sparkles, Trash2, LogIn, BrainCircuit, List, Save } from 'lucide-react';
import { estimateProjectFeature } from '@/ai/genkit';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';


interface Feature {
  id: string;
  name: string;
  priceMin?: number;
  priceMax?: number;
  justification?: string;
  isEstimating: boolean;
}

const ProjectCalculatorContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    const { toast } = useToast();
    const { user, fetchWithAuth } = useAuth();
    
    const [projectTitle, setProjectTitle] = useState('');
    const [features, setFeatures] = useState<Feature[]>([]);
    const [newFeatureName, setNewFeatureName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const featureInputRef = useRef<HTMLInputElement>(null);

    const fetchProjectData = useCallback(async (uuid: string) => {
        setIsLoadingData(true);
        try {
            const { data } = await fetchWithAuth(`/api/project-estimator/${uuid}`);
            if (!data.success) throw new Error(data.message);
            
            const project = data.estimation;
            setProjectTitle(project.title);
            setFeatures(project.features.map((f: any, i: number) => ({
                id: `feature_${Date.now()}_${i}`,
                name: f.description,
                priceMin: parseFloat(f.price_min),
                priceMax: parseFloat(f.price_max),
                justification: f.justification,
                isEstimating: false,
            })));
        } catch (e) {
            toast({ variant: 'destructive', title: 'Gagal Memuat', description: (e as Error).message });
            router.push('/project-calculator');
        } finally {
            setIsLoadingData(false);
        }
    }, [fetchWithAuth, toast, router]);

    useEffect(() => {
        if (editId) {
            fetchProjectData(editId);
        } else {
             setProjectTitle('');
             setFeatures([]);
             setIsLoadingData(false);
        }
    }, [editId, fetchProjectData]);

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
                projectName: projectTitle || 'Proyek Umum', 
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
             setFeatures(prev => prev.filter(f => f.id !== newFeature.id));
        }
    };
    
    const removeFeature = (id: string) => {
        setFeatures(prev => prev.filter(f => f.id !== id));
    };

    const totalMin = features.reduce((sum, f) => sum + (f.priceMin || 0), 0);
    const totalMax = features.reduce((sum, f) => sum + (f.priceMax || 0), 0);

    const handleSaveEstimation = async () => {
        if (!projectTitle.trim()) {
            toast({ variant: 'destructive', title: 'Judul Proyek Kosong', description: 'Mohon masukkan judul proyek sebelum menyimpan.'});
            return;
        }
        if (features.some(f => f.isEstimating)) {
            toast({ variant: 'destructive', title: 'Masih Memproses', description: 'Tunggu semua estimasi fitur selesai sebelum menyimpan.'});
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                uuid: editId || uuidv4(),
                title: projectTitle,
                features: features.map(f => ({
                    description: f.name,
                    priceMin: f.priceMin!,
                    priceMax: f.priceMax!,
                    justification: f.justification!,
                })),
                totalMinPrice: totalMin,
                totalMaxPrice: totalMax,
            };
            
            const method = editId ? 'PUT' : 'POST';
            const { data } = await fetchWithAuth('/api/project-estimator', {
                 method,
                 data: payload
            });

            if (!data.success) throw new Error(data.message);

            toast({ title: 'Berhasil Disimpan!', description: 'Estimasi proyek Anda telah disimpan.'});
            
            // Redirect to list page to see the result
            router.push('/project-calculator/list');

        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    }
    
    if (isLoadingData) {
        return <LoadingOverlay isLoading={true} message="Memuat data proyek..." />;
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <Card className="max-w-3xl mx-auto shadow-2xl">
                <CardHeader>
                   <div className='text-center mx-auto'>
                        <Sparkles className="w-12 h-12 mx-auto text-primary" />
                        <CardTitle className="text-3xl font-headline mt-2">Kalkulator Estimasi Proyek</CardTitle>
                        <CardDescription>Dapatkan estimasi biaya untuk ide atau proyek Anda dengan cepat menggunakan AI.</CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <Button variant="outline" onClick={() => router.push('/project-calculator/list')} className="w-full">
                        <List className="mr-2"/> Lihat Proyek Tersimpan
                    </Button>
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
                            <div className="text-right space-y-2">
                                <div>
                                    <h3 className="text-lg font-semibold">Total Estimasi Harga</h3>
                                    <p className="text-2xl font-bold text-primary">Rp {totalMin.toLocaleString('id-ID')} - Rp {totalMax.toLocaleString('id-ID')}</p>
                                    <p className="text-xs text-muted-foreground">*Harga merupakan estimasi kasar dan dapat bervariasi.</p>
                                </div>
                                <Button onClick={handleSaveEstimation} disabled={isSaving || features.some(f => f.isEstimating)}>
                                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>}
                                    {editId ? 'Perbarui Estimasi' : 'Simpan Estimasi'}
                                </Button>
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
