import PortalClient from '@/components/PortalClient';
import { fetchApplicationsFromSheet, ApplicationRecord } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export default async function Page() {
    let initialSubmissions: ApplicationRecord[] = [];
    try {
        initialSubmissions = await fetchApplicationsFromSheet();
    } catch (err) {
        console.error('Server-side fetch error:', err);
    }

    return <PortalClient initialSubmissions={initialSubmissions} />;
}
