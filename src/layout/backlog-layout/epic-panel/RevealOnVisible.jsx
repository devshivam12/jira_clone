import { useEffect, useRef, useState } from "react";

// Renders a plain box until the slot is near the viewport, then builds the real
// children and stops watching. Epics further down a long list cost a single
// empty div until the user scrolls towards them.
//
// Cards that scroll back out stay mounted on purpose: they hold the task list
// of an epic the user opened, and throwing that away would mean fetching it
// again for a card they only scrolled past.
const RevealOnVisible = ({ placeholderHeight = 64, children }) => {
  const [revealed, setRevealed] = useState(false);
  const slotRef = useRef(null);

  useEffect(() => {
    if (revealed) return;
    const slot = slotRef.current;
    if (!slot) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setRevealed(true);
      },
      { rootMargin: "300px" }
    );

    observer.observe(slot);
    return () => observer.disconnect();
  }, [revealed]);

  if (revealed) return children;

  return (
    <div
      ref={slotRef}
      style={{ height: placeholderHeight }}
      className="rounded-xl border border-neutral-200 bg-neutral-50/60"
    />
  );
};

export default RevealOnVisible;
