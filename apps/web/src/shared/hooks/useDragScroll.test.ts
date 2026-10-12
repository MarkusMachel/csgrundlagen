import { renderHook } from '@testing-library/react';

import { useDragScroll } from './useDragScroll';

/** A strip 300px wide showing 100px, so it can scroll 200px. */
function strip() {
  const el = document.createElement('nav');
  Object.defineProperty(el, 'scrollWidth', { value: 300 });
  Object.defineProperty(el, 'clientWidth', { value: 100 });
  const link = document.createElement('a');
  el.appendChild(link);
  document.body.appendChild(el);
  renderHook(() => useDragScroll({ current: el }));
  return { el, link };
}

// jsdom has no PointerEvent; a MouseEvent with pointerType reads the same to the hook
function pointer(type: string, target: EventTarget, clientX: number) {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 });
  Object.defineProperty(e, 'pointerType', { value: 'mouse' });
  target.dispatchEvent(e);
}

describe('useDragScroll', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('turns a vertical wheel into sideways scrolling', () => {
    const { el } = strip();
    const wheel = new WheelEvent('wheel', { deltaY: 80, cancelable: true });
    el.dispatchEvent(wheel);
    expect(el.scrollLeft).toBe(80);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it('lets the page scroll once the strip is at its end', () => {
    const { el } = strip();
    const wheel = new WheelEvent('wheel', { deltaY: -40, cancelable: true });
    el.dispatchEvent(wheel);
    expect(el.scrollLeft).toBe(0);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('scrolls with a mouse drag and swallows the click that ends it', () => {
    const { el, link } = strip();
    pointer('pointerdown', link, 200);
    pointer('pointermove', window, 140);
    pointer('pointerup', window, 140);
    expect(el.scrollLeft).toBe(60);

    const onClick = vi.fn();
    link.addEventListener('click', onClick);
    link.click();
    expect(onClick).not.toHaveBeenCalled();

    link.click(); // the next, real click goes through
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps a plain click (no movement) a click', () => {
    const { link } = strip();
    const onClick = vi.fn();
    link.addEventListener('click', onClick);
    pointer('pointerdown', link, 200);
    pointer('pointermove', window, 202);
    pointer('pointerup', window, 202);
    link.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
