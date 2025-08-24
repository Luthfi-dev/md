
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Notebook, MoreVertical } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Estimation {
    uuid: string;
    title: string;
    total_min_price: number;
    total_max_price: number;
    created_at: string;
}

export default function SavedEstimationsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [estimations, setEstimations] = useState<Estimation[]>([]);
    const [deletingProject, setDeletingProject] = useState<Estimation | null>(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const res = await fetchWithAuth('/api/project-estimator');
            if (!res.ok) throw new Error("Gagal memuat data estimasi.");
            
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            setEstimations(data.estimations || []);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: (e as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchWithAuth, toast]);
    
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) router.push('/account');
        if (isAuthenticated) fetchData();
    }, [isAuthLoading, isAuthenticated, router, fetchData]);

    const handleDelete = async () => {
        if (!deletingProject) return;

        const originalEstimations = [...estimations];
        setEstimations(estimations.filter(e => e.uuid !== deletingProject.uuid));

        try {
            const res = await fetchWithAuth(`/api/project-estimator/${deletingProject.uuid}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal menghapus proyek di server.");
            }
            toast({ title: "Proyek Dihapus", description: `"${deletingProject.title}" telah dihapus.` });
        } catch (e) {
            toast({ variant: 'destructive', title: "Gagal Menghapus", description: (e as Error).message });
            setEstimations(originalEstimations);
        } finally {
            setDeletingProject(null);
        }
    };
    
    if (isAuthLoading || isLoading) {
        return <LoadingOverlay isLoading={true} message="Memuat proyek tersimpan..." />;
    }

    return (
         <>
            <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Proyek "{deletingProject?.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan dan akan menghapus proyek secara permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="min-h-screen bg-secondary/30">
                <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                    <Button variant="ghost" onClick={() => router.push('/project-calculator')} className="mb-4 -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Kalkulator
                    </Button>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold font-headline">Estimasi Proyek Tersimpan</h1>
                        <p className="text-muted-foreground">Lihat kembali semua estimasi yang telah Anda buat.</p>
                    </div>
                    
                    <div className="space-y-4">
                        {estimations.length > 0 ? estimations.map(est => (
                           <Card key={est.uuid} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/project-calculator/${est.uuid}`)}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle>{est.title}</CardTitle>
                                            <CardDescription>Dibuat pada: {new Date(est.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreVertical /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenuItem onClick={() => router.push(`/project-calculator?id=${est.uuid}`)}>
                                                    <Edit className="mr-2"/> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingProject(est)}>
                                                    <Trash2 className="mr-2"/> Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                 <CardContent>
                                    <p className="text-lg font-bold text-primary">
                                        Rp {Number(est.total_min_price).toLocaleString('id-ID')} - Rp {Number(est.total_max_price).toLocaleString('id-ID')}
                                    </p>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <Notebook className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">Belum Ada Estimasi</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Estimasi yang Anda simpan akan muncul di sini.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
