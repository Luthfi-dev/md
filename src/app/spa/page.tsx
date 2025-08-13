
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, KeyRound, Mail } from "lucide-react";

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+10,250</div>
            <p className="text-xs text-muted-foreground">
              Termasuk semua role
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kunci API Aktif
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Kunci Gemini siap digunakan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                Konfigurasi SMTP
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Server email aktif
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang, Super Admin!</CardTitle>
          <CardDescription>Ini adalah pusat kendali tertinggi Anda. Gunakan menu di samping untuk mengelola konfigurasi sistem inti.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Anda memiliki akses penuh untuk mengelola kunci API layanan eksternal dan server SMTP untuk pengiriman email. Harap berhati-hati saat melakukan perubahan pada halaman pengaturan.</p>
        </CardContent>
      </Card>
    </div>
  );
}
