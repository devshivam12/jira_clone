import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import AppBreadcrumb from '@/components/common/AppBreadcrumb';
import { useProjectData } from '@/hooks/useProjectData';
import { useGetTaskByIdQuery } from '@/redux/graphql_api/task';
import { formatTaskKey } from '@/lib/taskLink';

// Turn a url slug like "my-board" into a readable label like "My Board". Used as
// a fallback only, when a tab does not carry its own title.
const toTitle = (value = '') =>
    value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

// Breadcrumb shown on every project page. It builds the trail from the current
// project and the active tab in the URL, so it stays correct on any project
// route (summary, backlog, board, timeline, forms) without extra wiring.
//
// Every value is read defensively. If the project has not loaded yet, or a tab
// is missing, the breadcrumb simply shows what it can instead of throwing.
const ProjectBreadcrumb = () => {
    const location = useLocation();
    const { currentProject, projectSlug, templateSlug } = useProjectData();

    // On the dedicated work item page the URL is
    // /dashboard/:project_slug/:template_slug/view/:task_id, so there is no tab
    // to name. The last crumb becomes the work item key instead.
    const segments = location.pathname.split('/').filter(Boolean);
    const viewedTaskId = segments[3] === 'view' ? segments[4] : null;

    // Same arguments the page itself uses, so this shares the cached result
    // rather than firing a second request.
    const { data: viewedTask } = useGetTaskByIdQuery(
        { operationName: 'getTaskDetail', variables: { taskId: viewedTaskId } },
        { skip: !viewedTaskId }
    );
    const viewedTaskData = viewedTask?.data?.getTaskDetail?.data;
    const viewedTaskKey = formatTaskKey(viewedTaskData?.project_key, viewedTaskData?.taskNumber);

    const items = useMemo(() => {
        // First crumb always points back to the projects list.
        const trail = [
            { key: 'projects', label: 'Projects', to: '/dashboard/projects', icon: Home },
        ];

        // Without a loaded project we can only show the root crumb.
        if (!currentProject || !projectSlug || !templateSlug) {
            return trail;
        }

        const tabs = currentProject?.template?.fields?.tabs || [];
        // URL shape: /dashboard/:project_slug/:template_slug/:tab
        const activeTabUrl = segments[3] || '';

        const defaultTab = tabs.find((tab) => tab.isDefault) || tabs[0] || null;
        const activeTab = tabs.find((tab) => tab.url === activeTabUrl) || defaultTab;

        const projectBase = `/dashboard/${projectSlug}/${templateSlug}`;

        // Second crumb is the project itself, linking to its default tab.
        trail.push({
            key: 'project',
            label: currentProject.name || projectSlug,
            to: defaultTab ? `${projectBase}/${defaultTab.url}` : projectBase,
        });

        // On the work item page the trail ends with the item, e.g. SCRUM-14.
        // The backlog crumb before it gives a way back to the list.
        if (viewedTaskId) {
            trail.push({
                key: 'backlog',
                label: 'Backlog',
                to: `${projectBase}/backlog`,
            });
            trail.push({
                key: 'work-item',
                label: viewedTaskKey || 'Work item',
            });
            return trail;
        }

        // Last crumb is the page you are on. It has no link (it is the current
        // location), so it renders as plain text.
        if (activeTab) {
            trail.push({
                key: 'tab',
                label: activeTab.title || toTitle(activeTab.url),
            });
        }

        return trail;
        // `segments` is derived from location.pathname, which is already in the
        // list, so it does not need its own entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject, projectSlug, templateSlug, location.pathname, viewedTaskId, viewedTaskKey]);

    return <AppBreadcrumb items={items} />;
};

export default ProjectBreadcrumb;
