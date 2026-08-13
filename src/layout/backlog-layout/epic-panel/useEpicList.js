import { useCallback, useEffect, useState } from "react";
import { useGetEpicListQuery } from "@/redux/graphql_api/timeline";

// Epics per request. The list is only headers and rollups, so a page is a
// small response, and the user rarely scrolls past the first one.
export const EPIC_PAGE_SIZE = 20;

// Frozen fallback. `payload?.epics || []` would hand a new array to every memo
// that reads this list on each render, which is exactly what we do not want in
// a view that can sit next to the backlog.
const EMPTY_LIST = Object.freeze([]);

// The epic list, paged. Shared by the sidebar panel and the full list view, so
// switching between the two reads the same cache entry instead of refetching.
//
// `search` is expected to be settled already (the views debounce their input),
// because a new term is a new server request, not a client-side filter.
export function useEpicList(projectId, search) {
  const [offset, setOffset] = useState(0);

  // A different project, or a different term, is a different list.
  useEffect(() => {
    setOffset(0);
  }, [projectId, search]);

  const { data, isLoading, isFetching, refetch } = useGetEpicListQuery(
    {
      operationName: "getEpicList",
      variables: {
        projectId,
        search: search || null,
        limit: EPIC_PAGE_SIZE,
        offset,
      },
    },
    { skip: !projectId }
  );

  const payload = data?.data?.getEpicList;
  const epics = payload?.epics || EMPTY_LIST;
  const totalCount = payload?.totalCount ?? epics.length;
  const hasMore = payload?.hasMore ?? false;

  // Guarded on isFetching so a fast scroll cannot ask for the same page twice.
  const loadMore = useCallback(() => {
    if (isFetching || !hasMore) return;
    setOffset(epics.length);
  }, [isFetching, hasMore, epics.length]);

  // Used after an epic is created or deleted. Paging restarts, because a new
  // epic belongs on the first page's ordering, not appended to whatever page
  // the user had scrolled to.
  const reload = useCallback(() => {
    if (offset === 0) refetch();
    else setOffset(0);
  }, [offset, refetch]);

  return { epics, totalCount, hasMore, isLoading, isFetching, loadMore, reload };
}
