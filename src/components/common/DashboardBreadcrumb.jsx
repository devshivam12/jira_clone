import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import AppBreadcrumb from '@/components/common/AppBreadcrumb';

// Readable labels and list-page links for the top-level dashboard sections.
// The key is the first path segment after /dashboard.
const SECTION_LABELS = {
    team: { label: 'Team', to: '/dashboard/team' },
    peoples: { label: 'People', to: '/dashboard/peoples' },
    projects: { label: 'Projects', to: '/dashboard/projects' },
    project: { label: 'Projects', to: '/dashboard/projects' }, // used by project/edit/:id
};

// Breadcrumb for the standard dashboard pages (Team, People, Projects and their
// edit screens). Project workspace routes (/dashboard/:slug/:template/...) have
// their own richer breadcrumb, so this returns nothing there to avoid two bars.
const DashboardBreadcrumb = () => {
    const location = useLocation();

    const items = useMemo(() => {
        // URL shape: /dashboard/:section/...
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments[0] !== 'dashboard') return [];

        const section = segments[1];
        const known = SECTION_LABELS[section];
        // Unknown section means the dashboard index redirect or a project
        // workspace route; both are handled elsewhere.
        if (!known) return [];

        const trail = [
            { key: 'section', label: known.label, to: known.to, icon: Home },
        ];

        // e.g. team/edit/:id  ->  Team / Edit
        if (segments[2] === 'edit') {
            trail.push({ key: 'edit', label: 'Edit' });
        }

        return trail;
    }, [location.pathname]);

    if (!items.length) return null;

    return <AppBreadcrumb items={items} />;
};

export default DashboardBreadcrumb;
