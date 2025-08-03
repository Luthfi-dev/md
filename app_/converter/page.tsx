
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  FileCode2, 
  FileImage, 
  ArrowRightLeft, 
  FileJson,
  FileUp,
  type LucideIcon 
} from 'lucide-react';
import { ReactNode } from 'react';


interface ConversionOption {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

const conversionOptions: ConversionOption[] = [
  {
    title: 'PDF ke Word',
    description: 'Ubah file PDF menjadi dokumen Word dengan tata letak visual asli.',
    href: '/converter/pdf-to-word',
    icon: (
      <div className="flex items-center gap-2">
        <FileText className="w-8 h-8 text-red-600" />
        <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
        <FileCode2 className="w-8 h-8 text-blue-600" />
      </div>
    ),
  },
   {
    title: 'Gambar ke PDF',
    description: 'Gabungkan satu atau lebih gambar menjadi satu file PDF.',
    href: '/converter/image-to-pdf',
    icon: (
       <div className="flex items-center gap-2">
        <FileImage className="w-8 h-8 text-green-600" />
        <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
        <FileText className="w-8 h-8 text-red-600" />
      </div>
    ),
  },
  {
    title: 'Word ke PDF',
    description: 'Ubah file Word menjadi dokumen PDF dengan tata letak asli.',
    href: '/converter/word-to-pdf',
    icon: (
       <div className="flex items-center gap-2">
        <FileCode2 className="w-8 h-8 text-blue-600" />
        <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
        <FileText className="w-8 h-8 text-red-600" />
      </div>
    ),
  },
];

export default function FileConverterHomePage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Konversi File</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Alat konversi online yang cepat dan andal untuk semua kebutuhan dokumen Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {conversionOptions.map((option) => (
            <Link href={option.href} key={option.title} className="group">
              <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary group-hover:-translate-y-1.5">
                <CardHeader>
                  <div className="flex justify-center mb-4">{option.icon}</div>
                  <CardTitle className="text-center">{option.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{option.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
