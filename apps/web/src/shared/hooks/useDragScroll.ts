import { useEffect, type RefObject } from 'react';

/** How far (px) the mouse must move before a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;

/**
 * Lets a mouse scroll a horizontal strip whose scrollbar is hidden: drag it
 * sideways, or turn the wheel over it. Touch and trackpads already scroll it
 * natively, so only mouse input is handled. A drag doesn't follow the link
 * it started on.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startScroll = 0;
    let pressed = false;
    let dragged = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      pressed = true;
      dragged = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pressed) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) < DRAG_THRESHOLD) return;
      dragged = true;
      el.classList.add('is-dragging');
      el.scrollLeft = startScroll - dx;
    };
    const onPointerUp = () => {
      pressed = false;
      el.classList.remove('is-dragging');
    };
    // the click that ends a drag must not open the tab under the pointer
    const onClick = (e: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      e.preventDefault();
      e.stopPropagation();
    };
    // links are draggable by default; that would start a native drag-and-drop instead
    const onDragStart = (e: DragEvent) => e.preventDefault();
    // a vertical wheel scrolls the strip sideways while it can still move that way
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // trackpad swipe: native
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const next = Math.min(max, Math.max(0, el.scrollLeft + e.deltaY));
      if (next === el.scrollLeft) return; // at the end: let the page scroll
      e.preventDefault();
      el.scrollLeft = next;
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('wheel', onWheel);
    };
  }, [ref]);
}
