import { useEffect, useMemo, useRef, useState } from "react";
import "./ShapeGridBackground.css";

const DIR_CLASS = {
  diagonal: "dir-diagonal",
  up: "dir-up",
  right: "dir-right",
  down: "dir-down",
  left: "dir-left"
};

export default function ShapeGridBackground({
  direction = "right",
  speed = 0.8,
  borderColor = "rgba(120, 160, 255, 0.2)",
  squareSize = 38,
  hoverFillColor = "rgba(120, 160, 255, 0.12)",
  shape = "square",
  hoverTrailAmount = 10
}) {
  const containerRef = useRef(null);
  const [gridMetrics, setGridMetrics] = useState({ cols: 1, rows: 1, count: 90 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [trail, setTrail] = useState([]);

  const gap = 10;

  useEffect(() => {
    const updateGridMetrics = () => {
      const el = containerRef.current;
      if (!el) return;
      const bounds = el.getBoundingClientRect();
      const cols = Math.max(1, Math.floor((bounds.width + gap) / (squareSize + gap)));
      const rows = Math.max(1, Math.floor((bounds.height + gap) / (squareSize + gap)));
      setGridMetrics({ cols, rows, count: cols * rows });
    };

    updateGridMetrics();
    window.addEventListener("resize", updateGridMetrics);
    return () => window.removeEventListener("resize", updateGridMetrics);
  }, [squareSize]);

  useEffect(() => {
    const onPointerMove = (event) => {
      const el = containerRef.current;
      if (!el) return;

      const bounds = el.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        setActiveIndex(-1);
        return;
      }

      const cellW = squareSize + gap;
      const col = Math.max(0, Math.min(gridMetrics.cols - 1, Math.floor(x / cellW)));
      const row = Math.max(0, Math.min(gridMetrics.rows - 1, Math.floor(y / cellW)));
      const nextIndex = row * gridMetrics.cols + col;

      setActiveIndex((prev) => {
        if (prev === nextIndex) return prev;
        setTrail((prevTrail) => [nextIndex, ...prevTrail.filter((idx) => idx !== nextIndex)].slice(0, hoverTrailAmount));
        return nextIndex;
      });
    };

    const onPointerLeave = () => setActiveIndex(-1);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [gridMetrics.cols, gridMetrics.rows, hoverTrailAmount, squareSize]);

  const tiles = useMemo(() => Array.from({ length: gridMetrics.count }, (_, i) => i), [gridMetrics.count]);
  const dirClass = DIR_CLASS[direction] || DIR_CLASS.right;

  return (
    <div
      ref={containerRef}
      className={`shape-grid-bg ${dirClass} shape-${shape}`}
      style={{
        "--shape-size": `${squareSize}px`,
        "--shape-speed": `${Math.max(speed, 0.15)}s`,
        "--shape-border": borderColor,
        "--shape-fill": hoverFillColor
      }}
      aria-hidden="true"
    >
      {tiles.map((tile) => (
        <span
          key={tile}
          className={`shape-grid-cell ${tile === activeIndex ? "is-active" : ""} ${trail.includes(tile) ? "is-trail" : ""}`}
          style={{
            "--i": tile,
            "--trail-order": trail.indexOf(tile)
          }}
        />
      ))}
    </div>
  );
}
