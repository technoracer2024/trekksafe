'use client';

import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let mx = -100, my = -100;
    let ox = -100, oy = -100;
    let ix = -100, iy = -100;
    let isHover = false;
    let isClick = false;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onMouseDown = (e: MouseEvent) => {
      isClick = true;
      outer.classList.add('click');

      // Primary cyan click ripple wave
      const r1 = document.createElement('div');
      r1.className = 'click-ripple';
      r1.style.left = `${e.clientX}px`;
      r1.style.top = `${e.clientY}px`;
      document.body.appendChild(r1);

      // Secondary emerald outer pulse
      const r2 = document.createElement('div');
      r2.className = 'click-ripple-2';
      r2.style.left = `${e.clientX}px`;
      r2.style.top = `${e.clientY}px`;
      document.body.appendChild(r2);

      setTimeout(() => {
        r1.remove();
        r2.remove();
      }, 700);
    };

    const onMouseUp = () => {
      isClick = false;
      outer.classList.remove('click');
    };

    const checkHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest('button, a, input, select, .trek-card, .cursor-pointer');
      if (clickable && !isHover) {
        isHover = true;
        outer.classList.add('hover');
        inner.classList.add('hover');
      } else if (!clickable && isHover) {
        isHover = false;
        outer.classList.remove('hover');
        inner.classList.remove('hover');
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousemove', checkHover, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });

    let animId: number;
    const render = () => {
      // Lerp outer cursor
      ox += (mx - ox) * 0.18;
      oy += (my - oy) * 0.18;
      ix += (mx - ix) * 0.45;
      iy += (my - iy) * 0.45;

      outer.style.transform = `translate3d(${ox}px, ${oy}px, 0) translate(-50%, -50%) ${isClick ? 'scale(0.85)' : isHover ? 'scale(1.6)' : 'scale(1)'}`;
      inner.style.transform = `translate3d(${ix}px, ${iy}px, 0) translate(-50%, -50%) ${isHover ? 'scale(1.3)' : 'scale(1)'}`;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousemove', checkHover);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div ref={outerRef} className="cur-outer hidden md:block" />
      <div ref={innerRef} className="cur-inner hidden md:block" />
    </>
  );
}
