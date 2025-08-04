
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileDown, FileText, Edit, AlertTriangle } from 'lucide-react';
import { saveAs } from 'file-saver';
import { type TemplateDataToShare } from '@/types/surat';
import { convertHtmlToWord } from '@/ai/flows/file-converter';

const LOCAL_STORAGE_KEY_SURAT_COUNTER = 'suratCounter_v1';

export default function FillSuratPage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<TemplateDataToShare | null>(null);
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const encodedData = searchParams.get('data');
        if (encodedData) {
            try {
                const decodedJson = decodeURIComponent(atob(encodedData));
                const parsedData: TemplateDataToShare = JSON.parse(decodedJson);

                if (parsedData.template && Array.isArray(parsedData.fields)) {
                    setData(parsedData);
                    const initialValues: { [key: string]: string } = {};
                    parsedData.fields.forEach(field => {
                        initialValues[field.id] = '';
                    });
                    setFieldValues(initialValues);
                } else {
                    throw new Error("Invalid data structure");
                }
            } catch (error) {
                console.error("Failed to parse data from URL", error);
                toast({
                    variant: 'destructive',
                    title: 'Link Tidak Valid',
                    description: 'Data template surat rusak atau tidak sesuai format.',
                });
                setData(null);
            }
        }
        setIsLoading(false);
    }, [searchParams, toast]);

    const handleInputChange = (id: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [id]: value }));
    };

    const isProFeatureUsed = useMemo(() => {
        return data?.template.includes('{{NOMOR_SURAT_OTOMATIS}}');
    }, [data]);

    const canDownload = useMemo(() => {
        if (!data) return false;
        if (data.isPro && isProFeatureUsed) {
            toast({
                variant: 'destructive',
                title: 'Fitur Pro Terdeteksi',
                description: 'Penomoran otomatis hanya tersedia pada versi pro.',
            });
            return false;
        }
        return true;
    }, [data, isProFeatureUsed, toast]);

    const generatedHtml = useMemo(() => {
        if (!data) return '';
        let result = data.template;
        Object.entries(fieldValues).forEach(([id, value]) => {
            const placeholder = new RegExp(`{{${id}}}`, 'g');
            const replacement = value ? `<span class="font-bold text-primary">${value}</span>` : `<span class="text-destructive">[${data.fields.find(f=>f.id===id)?.label || id}]</span>`;
            result = result.replace(placeholder, replacement);
        });

        const autoNumberPlaceholder = /\{\{NOMOR_SURAT_OTOMATIS\}\}/g;
        if(autoNumberPlaceholder.test(result)) {
             result = result.replace(autoNumberPlaceholder, '<span class="font-bold text-primary">[Nomor Surat Akan Dibuat Saat Unduh]</span>');
        }
        
        return result;
    }, [data, fieldValues]);

    const getNextSuratNumber = (): number => {
        try {
            const currentCounter = window.localStorage.getItem(LOCAL_STORAGE_KEY_SURAT_COUNTER);
            const nextNumber = currentCounter ? parseInt(currentCounter, 10) + 1 : 1;
            window.localStorage.setItem(LOCAL_STORAGE_KEY_SURAT_COUNTER, String(nextNumber));
            return nextNumber;
        } catch (error) {
            console.error("Failed to access localStorage for letter counter", error);
            return Math.floor(Math.random() * 1000) + 1;
        }
    };

    const handleDownload = async () => {
        if (!data || !canDownload) return;
        setIsGenerating(true);
        
        let docxContent = data.template;
        Object.entries(fieldValues).forEach(([id, value]) => {
            const placeholder = new RegExp(`{{${id}}}`, 'g');
            docxContent = docxContent.replace(placeholder, value || `[${data.fields.find(f=>f.id===id)?.label || id}]`);
        });

        const autoNumberPlaceholder = /\{\{NOMOR_SURAT_OTOMATIS\}\}/g;
        if(autoNumberPlaceholder.test(docxContent)) {
            const nextNumber = getNextSuratNumber();
            docxContent = docxContent.replace(autoNumberPlaceholder, String(nextNumber).padStart(3, '0'));
        }
        
        try {
            const response = await convertHtmlToWord({
                htmlContent: `<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">${docxContent}</div>`,
                filename: 'surat-yang-dihasilkan.docx'
            });

            if (response.docxDataUri) {
                saveAs(response.docxDataUri, 'surat-yang-dihasilkan.docx');
                toast({ title: 'Berhasil!', description: 'Dokumen Word sedang diunduh.' });
            } else {
                throw new Error(response.error || 'Gagal mengonversi file di server.');
            }
        } catch (error) {
             console.error('Download Error:', error);
             const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal.';
             toast({
                variant: 'destructive',
                title: 'Gagal Mengunduh',
                description: errorMessage,
             });
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!data) {
        return (
             <div className="flex justify-center items-center h-screen">
                 <Card className="max-w-md text-center p-8">
                     <CardTitle className="text-2xl text-destructive">Link Tidak Valid</CardTitle>
                     <CardDescription className="mt-2">Kami tidak dapat memproses link ini. Pastikan link sudah benar.</CardDescription>
                 </Card>
             </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-24 bg-secondary/50 min-h-screen">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-1 space-y-6">
                     <Card className="shadow-xl sticky top-8">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-3"><Edit className="w-6 h-6 text-primary" />Isi Data Surat</CardTitle>
                            <CardDescription>Lengkapi field di bawah ini untuk mengisi surat secara otomatis.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isProFeatureUsed && data.isPro && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive-foreground border border-destructive/20">
                                    <p className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Fitur Pro Tidak Tersedia</p>
                                    <p className="text-xs">Template ini menggunakan fitur yang tidak tersedia di paket Anda.</p>
                                </div>
                            )}
                            {data.fields.map(field => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    <Input id={field.id} value={fieldValues[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} placeholder={`Masukkan ${field.label}...`} />
                                </div>
                            ))}
                             <Button onClick={handleDownload} disabled={isGenerating || !canDownload} className="w-full">
                                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : <><FileDown className="mr-2 h-4 w-4" /> Unduh sebagai Word</>}
                            </Button>
                        </CardContent>
                     </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3"><FileText className="w-6 h-6 text-primary"/>Pratinjau Surat</CardTitle>
                            <CardDescription>Surat akan diperbarui secara otomatis saat Anda mengisi data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div ref={previewRef} className="bg-white p-8 shadow-inner min-h-[800px] rounded-lg border font-serif">
                                <div dangerouslySetInnerHTML={{ __html: generatedHtml }} style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "1.5" }} />
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
