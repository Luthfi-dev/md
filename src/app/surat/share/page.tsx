
'use client';

// This is a redirect component.
// The `surat/share` route is deprecated and now handled by `surat/[id]`.
// We keep this file to redirect any old links to the new structure
// to avoid breaking changes for users.

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ShareRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const data = searchParams.get('data');
        if (data) {
            // Forward the data to the new dynamic route
            router.replace(`/surat/share-fallback?data=${data}`);
        } else {
            // If no data, just go to the main surat page
            router.replace('/surat');
        }
    }, [router, searchParams]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Mengarahkan ulang...</p>
            </div>
        </div>
    );
}
