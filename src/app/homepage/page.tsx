"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";

const mapLayer = {
  src: "/images/layers/vietnam-map-ink-v4-right-overlay.png",
  className: "opacity-58 mix-blend-multiply blur-[0.6px]",
};

const booksLayer = {
  src: "/images/layers/archival-documents-collage-v2-overlay.png",
  className: "opacity-90 mix-blend-multiply",
};

const flagLayer = {
  src: "/images/layers/red-party-fabric-v2-overlay.png",
  className: "opacity-95 mix-blend-multiply",
};

const pathLayer = {
  src: "/images/layers/golden-timeline-path-v6-generated-overlay.png",
  className: "opacity-95",
};

const staticLayers = [
  {
    src: "/images/layers/history-light-particles-v2-overlay.png",
    className: "opacity-36 translate-y-[-30vw]",
  },
];

const mapStart = {
  x: -35,
  y: 18,
  scale: 1.9,
};

const mapEnd = {
  x: -147,
  y: 89,
  scale: 3.2,
};

const booksStart = {
  x: -2,
  y: 3,
  scale: 0.78,
};

const booksEnd = {
  x: -26,
  y: 23,
  scale: 0.46,
};

const flagStart = {
  x: 0,
  y: 3,
  scale: 0.78,
};

const flagEnd = {
  x: -26,
  y: 23,
  scale: 0.46,
};

const pathStart = {
  y: 0,
};

const pathEnd = {
  y: 100,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export default function Homepage() {
  const sceneRef = useRef<HTMLElement | null>(null);
  const mapLayerRef = useRef<HTMLDivElement | null>(null);
  const booksLayerRef = useRef<HTMLDivElement | null>(null);
  const flagLayerRef = useRef<HTMLDivElement | null>(null);
  const pathLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const mapElement = mapLayerRef.current;
    const booksElement = booksLayerRef.current;
    const flagElement = flagLayerRef.current;
    const pathElement = pathLayerRef.current;

    if (!scene || !mapElement || !booksElement || !flagElement || !pathElement) {
      return;
    }

    const setLayerProgress = (scroll: number) => {
      const animationDistance = window.innerHeight * 0.5;
      const rawProgress = (scroll - scene.offsetTop) / animationDistance;
      const progress = clamp(rawProgress, 0, 1);
      const mapX = lerp(mapStart.x, mapEnd.x, progress);
      const mapY = lerp(mapStart.y, mapEnd.y, progress);
      const mapScale = lerp(mapStart.scale, mapEnd.scale, progress);
      const booksX = lerp(booksStart.x, booksEnd.x, progress);
      const booksY = lerp(booksStart.y, booksEnd.y, progress);
      const booksScale = lerp(booksStart.scale, booksEnd.scale, progress);
      const flagX = lerp(flagStart.x, flagEnd.x, progress);
      const flagY = lerp(flagStart.y, flagEnd.y, progress);
      const flagScale = lerp(flagStart.scale, flagEnd.scale, progress);
      const pathY = lerp(pathStart.y, pathEnd.y, progress);

      mapElement.style.transform = `translate3d(${mapX}vw, ${mapY}vh, 0) scale(${mapScale})`;
      booksElement.style.transform = `translate3d(${booksX}vw, ${booksY}vh, 0) scale(${booksScale})`;
      flagElement.style.transform = `translate3d(${flagX}vw, ${flagY}vh, 0) scale(${flagScale})`;
      pathElement.style.transform = `translate3d(0, ${pathY}vh, 0)`;
    };

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.08,
      smoothWheel: true,
    });

    const handleScroll = (instance: Lenis) => {
      setLayerProgress(instance.scroll);
    };

    const handleResize = () => {
      lenis.resize();
      setLayerProgress(lenis.scroll);
    };

    lenis.on("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    setLayerProgress(window.scrollY);

    return () => {
      lenis.off("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      lenis.destroy();
    };
  }, []);

  return (
    <main
      ref={sceneRef}
      className="relative h-[150vh] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/vietnam-timeline-background.png')" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          ref={mapLayerRef}
          className="pointer-events-none absolute inset-0 origin-left will-change-transform"
        >
          <Image
            src={mapLayer.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${mapLayer.className}`}
          />
        </div>

        <div
          ref={booksLayerRef}
          className="pointer-events-none absolute inset-0 origin-bottom-left will-change-transform"
        >
          <Image
            src={booksLayer.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${booksLayer.className}`}
          />
        </div>

        <div
          ref={flagLayerRef}
          className="pointer-events-none absolute inset-0 origin-bottom-left will-change-transform"
        >
          <Image
            src={flagLayer.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${flagLayer.className}`}
          />
        </div>

        <div
          ref={pathLayerRef}
          className="pointer-events-none absolute inset-0 will-change-transform"
        >
          <Image
            src={pathLayer.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover ${pathLayer.className}`}
          />
        </div>

        {staticLayers.map((layer) => (
          <Image
            key={layer.src}
            src={layer.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`pointer-events-none object-cover ${layer.className}`}
          />
        ))}
      </div>
    </main>
  );
}
