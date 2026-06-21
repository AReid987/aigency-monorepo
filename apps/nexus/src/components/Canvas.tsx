import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseOffset: number;
}

function hexToRgba(hex: string, alpha: number): string {
  // Accepts short OKLCH fallback: if not hex, return as-is with alpha
  if (!hex.startsWith("#")) {
    if (hex.startsWith("oklch")) {
      return hex;
    }
    return `rgba(255,255,255,${alpha})`;
  }
  const clean = hex.replace("#", "");
  const bigint = Number.parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let raf = 0;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const count = Math.min(120, Math.floor((width * height) / 12000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    };

    let shootingStar = { x: -100, y: -100, vx: 0, vy: 0, life: 0 };
    let nextShootingStar = performance.now() + 15000;

    const spawnShootingStar = () => {
      const y = Math.random() * height * 0.6;
      shootingStar = {
        x: -40,
        y,
        vx: 3 + Math.random() * 2,
        vy: 0.2 + Math.random() * 0.5,
        life: 1,
      };
      nextShootingStar = performance.now() + 20000 + Math.random() * 25000;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const accent = readCssVar("--aig-accent") || "oklch(0.75 0.150 65)";
      const go = readCssVar("--aig-signal-go") || "oklch(0.72 0.170 160)";

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) {
          p.x = width;
        }
        if (p.x > width) {
          p.x = 0;
        }
        if (p.y < 0) {
          p.y = height;
        }
        if (p.y > height) {
          p.y = 0;
        }

        const pulse = 0.7 + 0.3 * Math.sin(time * 0.001 + p.pulseOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(accent, p.alpha * pulse * 0.45);
        ctx.fill();
      }

      // Shooting star
      if (performance.now() > nextShootingStar) {
        spawnShootingStar();
      }
      if (shootingStar.life > 0) {
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.life -= 0.008;
        const sx = shootingStar.x;
        const sy = shootingStar.y;
        const tail = 60;
        const grad = ctx.createLinearGradient(sx, sy, sx - tail, sy - tail * 0.2);
        grad.addColorStop(0, hexToRgba(go, shootingStar.life * 0.9));
        grad.addColorStop(1, hexToRgba(go, 0));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - tail, sy - tail * 0.2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(go, shootingStar.life);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="aig-canvas" aria-hidden="true" />
      <div className="aig-grid-beam" aria-hidden="true" />
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative background canvas */}
      <canvas ref={canvasRef} className="aig-particles" aria-hidden="true" />
      <div className="aig-dither" aria-hidden="true" />
    </>
  );
}
