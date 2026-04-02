import { useEffect, useRef } from "react";
import "./LightRaysBackground.css";

const rayAngles = [-72, -54, -36, -18, 0, 18, 36, 54, 72];

export default function LightRaysBackground({
  raysOrigin = "top-center",
  raysColor = "120, 217, 255",
  raysSpeed = 1,
  lightSpread = 0.55,
  rayLength = 1,
  pulsating = true,
  fadeDistance = 1,
  saturation = 1,
  followMouse = true,
  mouseInfluence = 0.12
}) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.18, active: false });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !followMouse) return undefined;

    const updateMouse = (event) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      mouseRef.current = {
        x: Math.min(Math.max(x, 0), 1),
        y: Math.min(Math.max(y, 0), 1),
        active: true
      };

      const moveX = (mouseRef.current.x - 0.5) * mouseInfluence * 100;
      const moveY = (mouseRef.current.y - 0.18) * mouseInfluence * 100;
      container.style.setProperty("--mouse-x", `${moveX}px`);
      container.style.setProperty("--mouse-y", `${moveY}px`);
    };

    const resetMouse = () => {
      mouseRef.current.active = false;
      container.style.setProperty("--mouse-x", `0px`);
      container.style.setProperty("--mouse-y", `0px`);
    };

    window.addEventListener("pointermove", updateMouse);
    window.addEventListener("pointerleave", resetMouse);
    window.addEventListener("blur", resetMouse);

    return () => {
      window.removeEventListener("pointermove", updateMouse);
      window.removeEventListener("pointerleave", resetMouse);
      window.removeEventListener("blur", resetMouse);
    };
  }, [followMouse, mouseInfluence]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-bg origin-${raysOrigin}`}
      style={{
        "--rays-color": raysColor,
        "--rays-speed": `${Math.max(raysSpeed, 0.1)}s`,
        "--light-spread": lightSpread,
        "--ray-length": rayLength,
        "--fade-distance": fadeDistance,
        "--saturation": saturation,
        "--mouse-x": "0px",
        "--mouse-y": "0px"
      }}
      aria-hidden="true"
    >
      <div className={`rays-core ${pulsating ? "pulsating" : ""}`} />
      <div className="rays-glow" />
      <div className="rays-noise" />
      <div className="rays-container">
        {rayAngles.map((angle, index) => (
          <span
            key={angle}
            className="ray"
            style={{
              "--angle": `${angle}deg`,
              animationDelay: `${index * -0.18}s`,
              opacity: 0.18 + index * 0.02
            }}
          />
        ))}
      </div>
    </div>
  );
}
