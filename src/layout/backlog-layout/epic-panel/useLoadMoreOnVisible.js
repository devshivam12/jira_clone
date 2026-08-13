import { useEffect, useRef } from "react";

// Calls `onLoadMore` when the returned ref lands in view. Attach the ref to an
// empty element placed after the last row of a list.
//
// This is why the epic panel and the task list inside an epic only ask for
// their next page when the end of the current one is actually reached, instead
// of measuring scroll offsets on every frame.
export function useLoadMoreOnVisible({ hasMore, isFetching, onLoadMore }) {
  const sentinelRef = useRef(null);

  // Read through a ref so re-creating the callback (it depends on the loaded
  // length) does not tear down and rebuild the observer on every page.
  const stateRef = useRef({ hasMore, isFetching, onLoadMore });
  stateRef.current = { hasMore, isFetching, onLoadMore };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        const { hasMore: more, isFetching: busy, onLoadMore: load } = stateRef.current;
        if (!more || busy) return;
        load?.();
      },
      // A little early, so the next page is on its way before the user hits
      // the bottom of the list.
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return sentinelRef;
}
