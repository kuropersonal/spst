"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";
import NorthMapScene from "@/components/NorthMapScene";

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
  const artworkRef = useRef<HTMLDivElement | null>(null);
  const mapLayerRef = useRef<HTMLDivElement | null>(null);
  const booksLayerRef = useRef<HTMLDivElement | null>(null);
  const flagLayerRef = useRef<HTMLDivElement | null>(null);
  const pathLayerRef = useRef<HTMLDivElement | null>(null);
  const transitionMapRef = useRef<HTMLDivElement | null>(null);
  const frameTopRef = useRef<HTMLDivElement | null>(null);
  const frameRightRef = useRef<HTMLDivElement | null>(null);
  const frameBottomRef = useRef<HTMLDivElement | null>(null);
  const frameLeftRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const artworkElement = artworkRef.current;
    const mapElement = mapLayerRef.current;
    const booksElement = booksLayerRef.current;
    const flagElement = flagLayerRef.current;
    const pathElement = pathLayerRef.current;
    const transitionMapElement = transitionMapRef.current;
    const frameTopElement = frameTopRef.current;
    const frameRightElement = frameRightRef.current;
    const frameBottomElement = frameBottomRef.current;
    const frameLeftElement = frameLeftRef.current;

    if (
      !scene ||
      !artworkElement ||
      !mapElement ||
      !booksElement ||
      !flagElement ||
      !pathElement ||
      !transitionMapElement ||
      !frameTopElement ||
      !frameRightElement ||
      !frameBottomElement ||
      !frameLeftElement
    ) {
      return;
    }

    const setLayerProgress = (scroll: number) => {
      const relativeScroll = scroll - scene.offsetTop;
      const travelDistance = window.innerHeight * 0.5;
      const zoomDistance = window.innerHeight * 0.18;
      const fadeDistance = window.innerHeight * 0.45;
      const frameDistance = window.innerHeight * 0.45;
      const progress = clamp(relativeScroll / travelDistance, 0, 1);
      const zoomProgress = clamp(
        (relativeScroll - travelDistance) / zoomDistance,
        0,
        1,
      );
      const mapFade = clamp(
        (relativeScroll - travelDistance - zoomDistance) / fadeDistance,
        0,
        1,
      );
      const frameProgress = clamp(
        (relativeScroll - travelDistance - zoomDistance - fadeDistance) /
          frameDistance,
        0,
        1,
      );
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
      const artworkScale = lerp(1, 1.08, zoomProgress);

      artworkElement.style.opacity = (1 - mapFade * 0.24).toString();
      artworkElement.style.transform = `scale(${artworkScale})`;
      mapElement.style.transform = `translate3d(${mapX}vw, ${mapY}vh, 0) scale(${mapScale})`;
      booksElement.style.transform = `translate3d(${booksX}vw, ${booksY}vh, 0) scale(${booksScale})`;
      flagElement.style.transform = `translate3d(${flagX}vw, ${flagY}vh, 0) scale(${flagScale})`;
      pathElement.style.transform = `translate3d(0, ${pathY}vh, 0)`;
      transitionMapElement.style.opacity = mapFade.toString();
      frameTopElement.style.opacity = frameProgress.toString();
      frameRightElement.style.opacity = frameProgress.toString();
      frameBottomElement.style.opacity = frameProgress.toString();
      frameLeftElement.style.opacity = frameProgress.toString();
      frameTopElement.style.transform = `translate3d(0, ${lerp(-100, 0, frameProgress)}%, 0)`;
      frameRightElement.style.transform = `translate3d(${lerp(100, 0, frameProgress)}%, 0, 0)`;
      frameBottomElement.style.transform = `translate3d(0, ${lerp(100, 0, frameProgress)}%, 0)`;
      frameLeftElement.style.transform = `translate3d(${lerp(-100, 0, frameProgress)}%, 0, 0)`;
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
      className="relative h-[280vh] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/vietnam-timeline-background.png')" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          ref={artworkRef}
          className="pointer-events-none absolute inset-0 origin-center will-change-[opacity,transform]"
        >
          <div
            ref={mapLayerRef}
            className="absolute inset-0 origin-left will-change-transform"
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
            className="absolute inset-0 origin-bottom-left will-change-transform"
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
            className="absolute inset-0 origin-bottom-left will-change-transform"
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
            className="absolute inset-0 will-change-transform"
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
              className={`object-cover ${layer.className}`}
            />
          ))}
        </div>

        <div
          ref={transitionMapRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 will-change-opacity"
        >
          <NorthMapScene className="h-full w-full" clipToVietnam />
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          <div
            ref={frameTopRef}
            className="absolute left-0 right-0 top-0 h-[15vh] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[opacity,transform]"
            style={{ transform: "translate3d(0, -100%, 0)" }}
          >
            <div
              className="absolute left-0 top-0 h-screen w-screen bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/images/vietnam-timeline-background.png')",
              }}
            />
          </div>

          <div
            ref={frameRightRef}
            className="absolute bottom-[10vh] right-0 top-[15vh] w-[24vw] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[opacity,transform]"
            style={{ transform: "translate3d(100%, 0, 0)" }}
          >
            <div
              className="absolute right-[-1vw] top-[-15vh] h-screen w-screen bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/images/vietnam-timeline-background.png')",
              }}
            />
          </div>

          <div
            ref={frameBottomRef}
            className="absolute bottom-0 left-0 right-0 h-[10vh] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[opacity,transform]"
            style={{ transform: "translate3d(0, 100%, 0)" }}
          >
            <div
              className="absolute bottom-0 left-0 h-screen w-screen bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/images/vietnam-timeline-background.png')",
              }}
            />
          </div>

          <div
            ref={frameLeftRef}
            className="absolute bottom-[10vh] left-0 top-[15vh] w-[26vw] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[opacity,transform]"
            style={{ transform: "translate3d(-100%, 0, 0)" }}
          >
            <div
              className="absolute left-0 top-[-15vh] h-screen w-screen bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/images/vietnam-timeline-background.png')",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
