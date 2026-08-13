import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { timelineApi } from "@/redux/graphql_api/timeline";

// Child tasks per request when an epic is expanded. Small on purpose: an
// epic with 400 tasks should cost one short request to peek at, not 400 rows.
export const CHILD_PAGE_SIZE = 25;

const EMPTY_STATE = { children: [], hasMore: false, totalCount: 0, loading: true };

// Owns which epics are expanded and the child tasks loaded for each one.
//
// The request is dispatched with `subscribe: false`, so RTK Query hands back
// the response and immediately drops it (the endpoint sets keepUnusedDataFor
// to 0). The only copy that survives is the one in this map, and collapsing a
// row deletes it. That is what keeps expanding rows from growing the store
// for the rest of the session.
export function useEpicChildren() {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(() => new Map());

  // The map is read inside async callbacks that would otherwise close over a
  // stale copy, so the ref is the source of truth and state exists to render.
  const expandedRef = useRef(expanded);
  const apply = useCallback((next) => {
    expandedRef.current = next;
    setExpanded(next);
  }, []);

  const patch = useCallback((epicId, changes) => {
    const current = expandedRef.current.get(epicId);
    if (!current) return; // collapsed while the request was in flight
    const next = new Map(expandedRef.current);
    next.set(epicId, { ...current, ...changes });
    apply(next);
  }, [apply]);

  const fetchPage = useCallback(async (epicId, offset) => {
    patch(epicId, { loading: true });
    try {
      const result = await dispatch(
        timelineApi.endpoints.getEpicChildren.initiate(
          { operationName: "getEpicChildren", variables: { epicId, limit: CHILD_PAGE_SIZE, offset } },
          { subscribe: false, forceRefetch: true }
        )
      ).unwrap();

      const payload = result?.data?.getEpicChildren;
      const current = expandedRef.current.get(epicId);
      if (!current) return;

      const incoming = payload?.children || [];
      const seen = new Set(current.children.map((c) => c._id));
      const merged = offset === 0
        ? incoming
        : [...current.children, ...incoming.filter((c) => !seen.has(c._id))];

      patch(epicId, {
        children: merged,
        hasMore: !!payload?.hasMore,
        totalCount: payload?.totalCount ?? current.totalCount,
        loading: false,
      });
    } catch {
      patch(epicId, { loading: false, hasMore: false });
    }
  }, [dispatch, patch]);

  const toggleEpic = useCallback((epicId) => {
    const next = new Map(expandedRef.current);
    if (next.has(epicId)) {
      next.delete(epicId);
      apply(next);
      return;
    }
    next.set(epicId, EMPTY_STATE);
    apply(next);
    fetchPage(epicId, 0);
  }, [apply, fetchPage]);

  // Used after a task is added to an epic from the chart. The row is opened
  // if it was still collapsed, so the new task is visible straight away, and
  // the list is re-read from the first page (any extra pages the user had
  // loaded are dropped - they can pull them again).
  const refreshEpic = useCallback((epicId) => {
    if (!expandedRef.current.has(epicId)) {
      const next = new Map(expandedRef.current);
      next.set(epicId, EMPTY_STATE);
      apply(next);
    }
    fetchPage(epicId, 0);
  }, [apply, fetchPage]);

  // Applies an edit to one child task that is already loaded. The epic panel's
  // list view edits tasks in place (status, importance, assignee, summary,
  // flag), and going through here means a row updates as soon as the mutation
  // is fired instead of waiting for a refetch of the whole page.
  //
  // A task has one parent, so only the epic it belongs to can hold it, and the
  // caller does not have to say which epic that is. Only expanded epics are
  // searched, and there are never many of those.
  const patchChild = useCallback((taskId, changes) => {
    let changed = false;
    const next = new Map();

    expandedRef.current.forEach((state, epicId) => {
      let found = false;
      const children = state.children.map((child) => {
        if (child._id !== taskId) return child;
        found = true;
        return { ...child, ...changes };
      });
      if (!found) {
        next.set(epicId, state);
        return;
      }
      changed = true;
      next.set(epicId, { ...state, children });
    });

    if (changed) apply(next);
  }, [apply]);

  // For actions that take a task out of the epic list entirely, such as
  // deleting it.
  const removeChild = useCallback((taskId) => {
    let changed = false;
    const next = new Map();

    expandedRef.current.forEach((state, epicId) => {
      if (!state.children.some((child) => child._id === taskId)) {
        next.set(epicId, state);
        return;
      }
      changed = true;
      next.set(epicId, {
        ...state,
        children: state.children.filter((child) => child._id !== taskId),
        totalCount: Math.max((state.totalCount || 0) - 1, 0),
      });
    });

    if (changed) apply(next);
  }, [apply]);

  const loadMoreChildren = useCallback((epicId) => {
    const current = expandedRef.current.get(epicId);
    if (!current || current.loading || !current.hasMore) return;
    fetchPage(epicId, current.children.length);
  }, [fetchPage]);

  const collapseAll = useCallback(() => {
    if (expandedRef.current.size === 0) return;
    apply(new Map());
  }, [apply]);

  // An epic filtered out by search, or belonging to a period the user has
  // navigated away from, is never coming back on screen in this state. Its
  // task list would just sit in memory, so it is dropped here.
  const pruneTo = useCallback((visibleEpicIds) => {
    if (expandedRef.current.size === 0) return;
    let changed = false;
    const next = new Map();
    expandedRef.current.forEach((value, key) => {
      if (visibleEpicIds.has(key)) next.set(key, value);
      else changed = true;
    });
    if (changed) apply(next);
  }, [apply]);

  return {
    expanded,
    toggleEpic,
    refreshEpic,
    loadMoreChildren,
    collapseAll,
    pruneTo,
    patchChild,
    removeChild,
  };
}

// Drops expansion state for epics that are no longer in the list.
export function usePruneExpanded(epics, pruneTo) {
  useEffect(() => {
    pruneTo(new Set(epics.map((e) => e._id)));
  }, [epics, pruneTo]);
}
