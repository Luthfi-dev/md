
'use client';
import ProfilePage from "./profile/page";

// Arahkan /account langsung ke halaman profil.
// Middleware akan menangani perlindungan rute ini dan mengarahkan pengguna yang belum login
// ke halaman /login.
export default function AccountPage() {
    return <ProfilePage />;
}
