
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Gem, Loader2, Star } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// Simulate fetching and saving data from a JSON file
import pricingPlansData from '@/data/pricing-plans.json';

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  priceDetails: string;
  description: string;
  features: string[];
  isPopular: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

export default function ManagePricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would be an API call.
    setPlans(pricingPlansData as PricingPlan[]);
    setIsLoading(false);
  }, []);

  const handleInputChange = (id: string, field: keyof PricingPlan, value: any) => {
    setPlans(currentPlans =>
      currentPlans.map(plan => (plan.id === id ? { ...plan, [field]: value } : plan))
    );
  };
  
  const handleFeatureChange = (id: string, featureIndex: number, value: string) => {
    setPlans(currentPlans =>
      currentPlans.map(plan => {
        if (plan.id === id) {
          const newFeatures = [...plan.features];
          newFeatures[featureIndex] = value;
          return { ...plan, features: newFeatures };
        }
        return plan;
      })
    );
  };

  const addFeature = (id: string) => {
     handleInputChange(id, 'features', [...plans.find(p => p.id === id)!.features, 'Fitur Baru']);
  };
  
  const removeFeature = (id: string, featureIndex: number) => {
      handleInputChange(id, 'features', plans.find(p => p.id === id)!.features.filter((_, i) => i !== featureIndex));
  }

  const handleAddNewPlan = () => {
    const newPlan: PricingPlan = {
      id: `plan_${Date.now()}`,
      name: "Paket Baru",
      price: "0",
      priceDetails: "/bulan",
      description: "Deskripsi singkat paket baru.",
      features: ["Fitur dasar"],
      isPopular: false,
      buttonText: "Mulai",
      buttonVariant: 'outline',
    };
    setPlans(currentPlans => [...currentPlans, newPlan]);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(currentPlans => currentPlans.filter(plan => plan.id !== id));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving to a file/API
    console.log("Saving pricing plans:", JSON.stringify(plans, null, 2));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Paket Harga Disimpan!",
      description: "Perubahan pada daftar paket harga telah berhasil disimpan.",
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gem /> Kelola Paket Harga</CardTitle>
          <CardDescription>
            Atur paket harga yang ditampilkan di halaman pricing. Tambah, edit, atau hapus paket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={handleAddNewPlan}><Plus className="mr-2 h-4 w-4" /> Tambah Paket</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update
            </Button>
          </div>

          <div className="space-y-4">
            {plans.map(plan => (
              <Card key={plan.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${plan.id}`}>Nama Paket</Label>
                    <Input id={`name-${plan.id}`} value={plan.name} onChange={e => handleInputChange(plan.id, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${plan.id}`}>Harga (contoh: 99.000)</Label>
                    <Input id={`price-${plan.id}`} value={plan.price} onChange={e => handleInputChange(plan.id, 'price', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`priceDetails-${plan.id}`}>Detail Harga (contoh: /bulan)</Label>
                    <Input id={`priceDetails-${plan.id}`} value={plan.priceDetails} onChange={e => handleInputChange(plan.id, 'priceDetails', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${plan.id}`}>Deskripsi</Label>
                    <Input id={`description-${plan.id}`} value={plan.description} onChange={e => handleInputChange(plan.id, 'description', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`buttonText-${plan.id}`}>Teks Tombol</Label>
                    <Input id={`buttonText-${plan.id}`} value={plan.buttonText} onChange={e => handleInputChange(plan.id, 'buttonText', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Varian Tombol</Label>
                    <select
                      value={plan.buttonVariant}
                      onChange={(e) => handleInputChange(plan.id, 'buttonVariant', e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="default">Default (Primary)</option>
                      <option value="secondary">Secondary</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <Label>Fitur-fitur</Label>
                     {plan.features.map((feature, index) => (
                         <div key={index} className="flex items-center gap-2">
                             <Input value={feature} onChange={e => handleFeatureChange(plan.id, index, e.target.value)} />
                             <Button variant="ghost" size="icon" onClick={() => removeFeature(plan.id, index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         </div>
                     ))}
                     <Button variant="outline" size="sm" onClick={() => addFeature(plan.id)}>Tambah Fitur</Button>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch id={`popular-${plan.id}`} checked={plan.isPopular} onCheckedChange={checked => handleInputChange(plan.id, 'isPopular', checked)} />
                    <Label htmlFor={`popular-${plan.id}`} className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500"/> Populer</Label>
                  </div>
                  <div className="ml-auto">
                    <Button variant="destructive" size="icon" onClick={() => handleDeletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
