
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Separator } from '@/components/ui/separator';

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

export default function EstimationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const uuid = params.uuid as string;
    
    const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [estimation, setEstimation] = useState<EstimationDetails | null>(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !uuid) return;
        setIsLoading(true);
        try {
            // This endpoint is public, but we use fetchWithAuth to ensure user is logged in to view their own projects this way
            const res = await fetchWithAuth(`/api/project-estimator/${uuid}`);
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.message || 'Gagal memuat detail estimasi.');
            }
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setEstimation(data.estimation);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: (e as Error).message });
            router.push('/project-calculator/list');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, uuid, fetchWithAuth, toast, router]);
    
    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                router.push('/account');
            } else {
                fetchData();
            }
        }
    }, [isAuthLoading, isAuthenticated, router, fetchData]);
    
    const handleShare = () => {
        const shareUrl = `${window.location.origin}/project-calculator/share/${uuid}`;
        navigator.clipboard.writeText(shareUrl);
        toast({
            title: "Link Disalin!",
            description: "Link estimasi proyek telah disalin ke clipboard.",
        });
    };

    if (isLoading || isAuthLoading || !estimation) {
        return <LoadingOverlay isLoading={true} message="Memuat detail estimasi..." />;
    }

    return (
        <div className="min-h-screen bg-secondary/30">
            <main className="container mx-auto max-w-4xl px-4 py-8 pb-24">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.push('/project-calculator/list')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Daftar
                    </Button>
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Bagikan
                    </Button>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">{estimation.title}</CardTitle>
                        <CardDescription>Dibuat oleh {estimation.author_name} pada {new Date(estimation.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
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
            </main>
        </div>
    );
}
