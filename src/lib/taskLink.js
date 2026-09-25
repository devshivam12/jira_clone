// Address of the dedicated work item page.
//
// The drawer keeps the task in a query string (`?issueId=...`) because it opens
// beside a list that has to stay on screen. The full page instead carries the id
// in the path, so the link can be pasted anywhere, reloaded, or opened in a new
// tab and still land on the same work item.
//
// Both slugs come from the project in redux, which is restored from local
// storage on a fresh tab, so a new tab has the project context it needs before
// the task query runs.
export const buildTaskPath = (projectSlug, templateSlug, taskId) => {
    if (!projectSlug || !templateSlug || !taskId) return null;
    return `/dashboard/${projectSlug}/${templateSlug}/view/${taskId}`;
};

// Same address with the origin in front, for the clipboard.
export const buildTaskUrl = (projectSlug, templateSlug, taskId) => {
    const path = buildTaskPath(projectSlug, templateSlug, taskId);
    if (!path) return null;
    return `${window.location.origin}${path}`;
};

// Human readable id of a work item, e.g. "SCRUM-14". Returns an empty string
// when either half is missing, so callers can drop it without a null check.
export const formatTaskKey = (projectKey, taskNumber) => {
    if (!projectKey || taskNumber == null) return "";
    return `${projectKey}-${taskNumber}`;
};
