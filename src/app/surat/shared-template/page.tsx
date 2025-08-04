
'use client';

import FillSuratPage from '../[id]/page';

// This component re-uses the logic from the dynamic [id] page but lives at a static route
// to handle the redirected share links.
export default function SharedTemplatePage() {
    return <FillSuratPage />;
}
