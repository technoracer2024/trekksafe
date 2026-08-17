'use client';

import React, { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    let nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number }> = [];
    const mouse = { x: null as number | null, y: null as number | null, rad: 140 };

    const resize = () => {
      if (!cvs.parentElement) return;
      const rect = cvs.parentElement.getBoundingClientRect();
      w = cvs.width = rect.width;
      h = cvs.height = rect.height;
      createNodes();
    };

    const createNodes = () => {
      nodes = [];
      const count = Math.min(48, Math.floor((w * h) / 22000));
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 2 + 1.2,
          alpha: Math.random() * 0.4 + 0.2
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      } else {
        mouse.x = null;
        mouse.y = null;
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    resize();

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains('dark');
      const nodeColor = isDark ? 'rgba(6, 182, 212, ' : 'rgba(8, 145, 178, ';
      const lineColor = isDark ? 'rgba(6, 182, 212, ' : 'rgba(8, 145, 178, ';

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.rad) {
            const force = (1 - dist / mouse.rad) * 1.5;
            n.x -= (dx / dist) * force;
            n.y -= (dy / dist) * force;
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor + n.alpha + ')';
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.16;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = lineColor + alpha + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-70" />;
}
