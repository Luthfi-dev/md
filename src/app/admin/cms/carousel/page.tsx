
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CarouselItem } from '@/types/app';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const CAROUSEL_STORAGE_KEY = 'cms_carousel_items_v1';

const getInitialItems = (): CarouselItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(CAROUSEL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [
            { id: 'item_1', title: 'Kuis Harian', description: 'Asah kemampuanmu dengan kuis interaktif', href: '/quiz', icon: 'BrainCircuit', status: 'published' },
            { id: 'item_2', title: 'Latihan Soal', description: 'Perbanyak latihan untuk persiapan ujian.', href: '/practice', icon: 'Edit', status: 'published' }
        ];
    } catch {
        return [];
    }
}

export default function ManageCarouselPage() {
    const [items, setItems] = useState<CarouselItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setItems(getInitialItems());
        setIsLoading(false);
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        try {
            localStorage.setItem(CAROUSEL_STORAGE_KEY, JSON.stringify(items));
            toast({ title: "Perubahan Disimpan!", description: "Item carousel telah diperbarui." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Gagal Menyimpan", description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleInputChange = (id: string, field: keyof CarouselItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    }
    
    const handleAddItem = () => {
        const newItem: CarouselItem = {
            id: `item_${Date.now()}`,
            title: 'Item Baru',
            description: 'Deskripsi singkat item baru.',
            href: '#',
            icon: 'Package',
            status: 'draft'
        };
        setItems(prev => [...prev, newItem]);
    }
    
    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }
    
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
                <CardTitle>Kelola Carousel Homepage</CardTitle>
                <CardDescription>
                    Atur item yang akan ditampilkan di carousel interaktif pada halaman utama.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex justify-between items-center mb-6">
                    <Button onClick={handleAddItem}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Item
                    </Button>
                     <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />} Simpan Perubahan
                    </Button>
                </div>

                <div className="space-y-4">
                    {items.map(item => (
                        <Card key={item.id} className="p-4">
                           <div className="flex items-start gap-4">
                                <GripVertical className="h-8 w-8 text-muted-foreground mt-8 cursor-grab" />
                                <div className="flex-grow space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor={`title-${item.id}`}>Judul</Label>
                                            <Input id={`title-${item.id}`} value={item.title} onChange={e => handleInputChange(item.id, 'title', e.target.value)} />
                                        </div>
                                         <div className="space-y-1">
                                            <Label htmlFor={`href-${item.id}`}>Link (URL)</Label>
                                            <Input id={`href-${item.id}`} value={item.href} onChange={e => handleInputChange(item.id, 'href', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor={`desc-${item.id}`}>Deskripsi</Label>
                                        <Textarea id={`desc-${item.id}`} value={item.description} onChange={e => handleInputChange(item.id, 'description', e.target.value)} rows={2} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor={`icon-${item.id}`}>Ikon (Lucide)</Label>
                                            <Input id={`icon-${item.id}`} value={item.icon} onChange={e => handleInputChange(item.id, 'icon', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-4 pt-6">
                                             <div className="flex items-center space-x-2">
                                                <Switch id={`status-${item.id}`} checked={item.status === 'published'} onCheckedChange={checked => handleInputChange(item.id, 'status', checked ? 'published' : 'draft')} />
                                                <Label htmlFor={`status-${item.id}`}>Publikasikan</Label>
                                            </div>
                                            <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                           </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
