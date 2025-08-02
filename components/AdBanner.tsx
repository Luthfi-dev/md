
'use client';

import { Card, CardContent } from "./ui/card";
import type { AdSetting } from "@/types/surat";
import Image from "next/image";

interface AdBannerProps {
    settings: AdSetting;
    isMobile: boolean;
}

export function AdBanner({ settings, isMobile }: AdBannerProps) {
    if (!settings.enabled) {
        return null;
    }

    if (settings.type === 'manual') {
        return (
            <Card>
                <CardContent className="p-2">
                    <Image 
                        src={settings.value} 
                        alt="Iklan"
                        width={isMobile ? 320 : 728}
                        height={isMobile ? 50 : 90}
                        className="mx-auto rounded"
                    />
                </CardContent>
            </Card>
        );
    }
    
    // Placeholder for platform-based ads like AdSense
    if (settings.type === 'platform') {
         return (
            <Card>
                <CardContent className="p-2">
                    <div className="bg-secondary text-muted-foreground text-center flex items-center justify-center h-[90px]">
                        {/* In a real app, you would render the ad component here using settings.value as ID */}
                        <p>Banner Iklan Platform ({settings.value})</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
