
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface Feature {
    description: string;
    price_min: number;
    price_max: number;
    justification: string;
}

interface EstimationDetails {
    title: string;
    author_name: string;
    total_min_price: number;
    total_max_price: number;
    created_at: string;
    features: Feature[];
}

export default function SharedEstimationPage() {
    const params = useParams();
    const uuid = params.uuid as string;
    
    const [isLoading, setIsLoading] = useState(true);
    const [estimation, setEstimation] = useState<EstimationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!uuid) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/project-estimator/${uuid}`);
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Estimasi tidak ditemukan.');
            }
            setEstimation(data.estimation);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [uuid]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (isLoading) {
        return <LoadingOverlay isLoading={true} message="Memuat estimasi proyek..." />;
    }

    if (error) {
        return (
             <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
                 <Alert variant="destructive" className="max-w-lg">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Gagal Memuat</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!estimation) {
        return null;
    }

    return (
        <div className="min-h-screen bg-secondary/30">
            <main className="container mx-auto max-w-4xl px-4 py-8 pb-24">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">{estimation.title}</CardTitle>
                        <CardDescription>Estimasi proyek dibuat oleh {estimation.author_name} pada {new Date(estimation.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Rincian Fitur</h3>
                            <div className="space-y-3">
                                {estimation.features.map((feature, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-secondary/50">
                                        <p className="font-semibold">{feature.description}</p>
                                        <p className="text-base font-bold text-primary">Rp {Number(feature.price_min).toLocaleString('id-ID')} - Rp {Number(feature.price_max).toLocaleString('id-ID')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{feature.justification}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Separator />

                        <div className="text-right">
                            <h3 className="text-xl font-bold">Total Estimasi Keseluruhan</h3>
                            <p className="text-3xl font-bold text-primary">
                                Rp {Number(estimation.total_min_price).toLocaleString('id-ID')} - Rp {Number(estimation.total_max_price).toLocaleString('id-ID')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">*Harga merupakan estimasi kasar dan dapat bervariasi.</p>
                        </div>
                    </CardContent>
                </Card>
                 <div className="text-center mt-8">
                    <Button asChild>
                        <Link href="/project-calculator">
                           Buat Estimasi Anda Sendiri
                        </Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
