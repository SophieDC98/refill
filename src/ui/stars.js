import { starSVG } from "./pixels.js";

const COUNT = 18;

// A burst of yellow pixel stars from the middle of anchorEl, inside windowEl.
export function burst(windowEl, anchorEl) {
  const w = windowEl.getBoundingClientRect();
  const r = anchorEl.getBoundingClientRect();
  const cx = r.left - w.left + r.width / 2;
  const cy = r.top - w.top + r.height / 2;
  const layer = document.createElement("div");
  layer.className = "burst";
  windowEl.appendChild(layer);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (let i = 0; i < COUNT; i++) {
    const star = document.createElement("span");
    star.innerHTML = starSVG();
    star.style.left = `${cx}px`;
    star.style.top = `${cy}px`;
    layer.appendChild(star);
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 70 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.8 - 20;
    const size = 0.7 + Math.random() * 0.9;
    const at = `translate(${dx}px,${dy}px) scale(${size})`;
    const frames = still
      ? [{ transform: at, opacity: 1 }, { transform: at, opacity: 0 }]
      : [
          { transform: "translate(0,0) scale(.3) rotate(0deg)", opacity: 1 },
          { transform: `${at} rotate(${Math.random() > 0.5 ? 90 : -90}deg)`, opacity: 1, offset: 0.65 },
          { transform: `translate(${dx}px,${dy + 30}px) scale(${size * 0.8}) rotate(0deg)`, opacity: 0 },
        ];
    star.animate(frames, {
      duration: still ? 1200 : 1100 + Math.random() * 500,
      easing: still ? "linear" : "steps(14)",
      fill: "forwards",
    });
  }
  setTimeout(() => layer.remove(), 1800);
}
