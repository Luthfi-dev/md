
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Loader2, GitCommitHorizontal } from "lucide-react";
import { getCurrentVersion, generateNewVersion } from './actions';
import { Label } from '@/components/ui/label';

export default function VersioningPage() {
    const [currentVersion, setCurrentVersion] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const fetchVersion = useCallback(async () => {
        setIsLoading(true);
        try {
            const version = await getCurrentVersion();
            setCurrentVersion(version);
        } catch (error) {
            toast({ variant: "destructive", title: "Gagal Memuat Versi", description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchVersion();
    }, [fetchVersion]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const newVersion = await generateNewVersion();
            setCurrentVersion(newVersion);
            toast({
                title: "Versi Baru Dibuat!",
                description: "Semua pengguna akan secara otomatis mendapatkan versi terbaru saat mereka membuka aplikasi kembali.",
            });
        } catch (error) {
             toast({ variant: "destructive", title: "Gagal Membuat Versi Baru", description: (error as Error).message });
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitCommitHorizontal /> Manajemen Versi Aplikasi
                </CardTitle>
                <CardDescription>
                    Buat versi baru untuk memaksa semua pengguna (termasuk yang menginstal PWA) membersihkan cache dan memuat ulang aplikasi ke versi terbaru.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>ID Versi Saat Ini</Label>
                    <div className="p-3 bg-secondary rounded-md font-mono text-sm break-all">
                        {currentVersion || 'Tidak ada versi'}
                    </div>
                     <p className="text-xs text-muted-foreground">
                        Setiap kali Anda menekan tombol di bawah, ID baru akan dibuat.
                    </p>
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Buat Versi Baru & Bersihkan Cache Pengguna
                </Button>
            </CardContent>
        </Card>
    );
}
