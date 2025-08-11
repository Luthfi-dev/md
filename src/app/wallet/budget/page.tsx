
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function BudgetPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-card flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md">
                 <div className="p-6 bg-primary/10 rounded-full inline-block mb-6">
                    <Construction className="w-16 h-16 text-primary" />
                 </div>
                <h1 className="text-3xl font-bold font-headline mb-4">Segera Hadir!</h1>
                <p className="text-muted-foreground mb-8">
                    Kami sedang bekerja keras untuk membangun fitur Anggaran yang canggih untuk Anda. Pantau terus pembaruannya!
                </p>
                <Button onClick={() => router.push('/wallet')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Dompet
                </Button>
            </div>
        </div>
    );
}
