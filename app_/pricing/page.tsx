
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Gem, Loader2, Star } from "lucide-react";
import { cn } from '@/lib/utils';
import { type PricingPlan } from '../admin/pricing/page';

// Simulate fetching data from a JSON file
import pricingPlansData from '@/data/pricing-plans.json';

export default function PricingPage() {
    const [plans, setPlans] = useState<PricingPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would be an API call.
        setPlans(pricingPlansData as PricingPlan[]);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <Gem className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-foreground mt-4 sm:text-5xl">
                        Pilih Paket yang Tepat Untuk Anda
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        Buka semua fitur canggih dan tingkatkan produktivitas Anda ke level berikutnya.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {plans.map(plan => (
                        <Card key={plan.id} className={cn(
                            "flex flex-col rounded-3xl shadow-lg transition-all duration-300",
                            plan.isPopular ? "border-2 border-primary ring-4 ring-primary/20 scale-105" : "hover:shadow-2xl hover:-translate-y-2"
                        )}>
                            {plan.isPopular && (
                                <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                        <Star className="w-4 h-4" /> Paling Populer
                                    </div>
                                </div>
                            )}
                            <CardHeader className="p-8">
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="flex items-baseline gap-x-2 pt-4">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">Rp {plan.price}</span>
                                    <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">{plan.priceDetails}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col p-8 pt-0">
                                <ul role="list" className="space-y-4 text-sm leading-6 text-muted-foreground flex-grow">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <CheckCircle className="h-6 w-6 flex-none text-primary" aria-hidden="true" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="lg"
                                    className="w-full mt-8 text-lg font-bold rounded-full"
                                    variant={plan.buttonVariant}
                                >
                                    {plan.buttonText}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                 <div className="text-center mt-12">
                    <p className="text-muted-foreground">Butuh solusi untuk tim besar atau perusahaan? <a href="#" className="font-semibold text-primary hover:underline">Hubungi kami</a>.</p>
                </div>
            </div>
        </div>
    );
}
