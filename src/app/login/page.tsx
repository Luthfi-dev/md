
'use client';
import AccountPage from '../account/page';

// This page simply renders the AccountPage, which contains the login/register logic.
// This makes `/login` a valid route for authentication.
export default function LoginPage() {
    return <AccountPage />;
}
