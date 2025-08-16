
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ManageCarouselPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Kelola Carousel Homepage</CardTitle>
                <CardDescription>
                    Atur item yang akan ditampilkan di carousel interaktif pada halaman utama.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex justify-between items-center">
                    <p>Daftar item carousel akan ditampilkan di sini.</p>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Item Baru
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
