
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileDown, FileText, Edit } from 'lucide-react';
import { saveAs } from 'file-saver';
import { convertHtmlToWord } from '@/ai/flows/file-converter';


interface SuratField {
  id: string;
  label: string;
}

interface TemplateData {
  template: string;
  fields: SuratField[];
}

export default function FillSuratPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const id = params.id as string;
    const { toast } = useToast();
    
    const [data, setData] = useState<TemplateData | null>(null);
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const encodedData = searchParams.get('data');
        if (encodedData) {
            try {
                const decodedJson = decodeURIComponent(atob(encodedData));
                const parsedData: TemplateData = JSON.parse(decodedJson);

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

    const generatedHtml = useMemo(() => {
        if (!data) return '';
        let result = data.template;
        Object.entries(fieldValues).forEach(([id, value]) => {
            const placeholder = new RegExp(`{{${id}}}`, 'g');
            const replacement = value ? `<span class="font-bold text-primary">${value}</span>` : `<span class="text-destructive">[${data.fields.find(f=>f.id===id)?.label || id}]</span>`;
            result = result.replace(placeholder, replacement);
        });
        return result.replace(/\n/g, '<br />');
    }, [data, fieldValues]);

    const handleDownload = async () => {
        if (!data) return;
        setIsGenerating(true);
        
        let docxContent = data.template;
        Object.entries(fieldValues).forEach(([id, value]) => {
            const placeholder = new RegExp(`{{${id}}}`, 'g');
            docxContent = docxContent.replace(placeholder, value || `[${data.fields.find(f=>f.id===id)?.label || id}]`);
        });
        
        try {
            const response = await convertHtmlToWord({
                htmlContent: `<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">${docxContent.replace(/\n/g, '<br />')}</div>`,
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
                            {data.fields.map(field => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    <Input id={field.id} value={fieldValues[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} placeholder={`Masukkan ${field.label}...`} />
                                </div>
                            ))}
                             <Button onClick={handleDownload} disabled={isGenerating} className="w-full">
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
                           <div ref={previewRef} className="bg-white p-8 shadow-inner min-h-[800px] rounded-lg border">
                                <div dangerouslySetInnerHTML={{ __html: generatedHtml }} style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12pt", lineHeight: "1.5" }} />
                           </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// Fallback component for when the ID is just "share" from the old URL structure
// This is to maintain compatibility with any old links that might be out there.
const SharePageFallback = () => {
    return <FillSuratPage />;
}

export { SharePageFallback as Page };

    
