import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

// Heights of the bars that stick to the top of the window, published as CSS variables on <html>:
// --nav-h (tab row) and --bar-h (page toolbar, e.g. «Прогнати»). Styles use them to place the page
// toolbar under the tabs and to size the run map so that it fits the space below both bars.

/** Keeps `--name` on <html> equal to the element's height, px; resets it to 0 on unmount. */
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: '--nav-h' | '--bar-h'): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty(name, `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty(name, '0px');
    };
  }, [ref, name]);
}

/** Total height of the sticky bars, px. */
export function stickyHeight(): number {
  const s = getComputedStyle(document.documentElement);
  return (parseFloat(s.getPropertyValue('--nav-h')) || 0) + (parseFloat(s.getPropertyValue('--bar-h')) || 0);
}
