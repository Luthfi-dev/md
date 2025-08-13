
'use client';
import ProfilePage from "./profile/page";

// The base /account route now directly renders the profile page
// for a seamless user experience. The middleware protects this route.
export default function AccountPage() {
    return <ProfilePage />;
}
