"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, type StyleSpecification } from "maplibre-gl";

type LonLat = [number, number] | [number, number, number];
type GeoJsonRing = LonLat[];
type GeoJsonPolygon = GeoJsonRing[];
type GeoJsonMultiPolygon = GeoJsonPolygon[];

type GeoJsonGeometry =
  | {
      type: "Polygon";
      coordinates: GeoJsonPolygon;
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoJsonMultiPolygon;
    };

type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonGeometry | null;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

type MaskGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, never>;
    geometry: {
      type: "Polygon";
      coordinates: [number, number][][];
    };
  }>;
};

const northViewBounds: [[number, number], [number, number]] = [
  [101.2, 17.6],
  [110.6, 24.2],
];

const initialCenter: [number, number] = [105.8, 21.3];
const vietnamGeoJsonPath = "/data/geo/vietnam.geojson";
const outsideVietnamPatternId = "homepage-background-mask";
const outsideVietnamPatternPath = "/images/vietnam-timeline-background.png";
const clippedMapBackground = "#e8ddbf";
const parisCameraProgressEvent = "homepage-map-paris-progress";
const parisCenter: [number, number] = [2.3522, 48.8566];
const parisFinalZoom = 11.2;
const guangzhouCenter: [number, number] = [113.2644, 23.1291];
const guangzhouFinalZoom = 10.6;
const guangzhouRouteZoom = 3;
const hongKongCenter: [number, number] = [114.1694, 22.3193];
const hongKongFinalZoom = 11;
const hongKongRouteZoom = 8.2;

type CameraTimelineProgress = {
  parisProgress: number;
  guangzhouProgress: number;
  hongKongProgress: number;
  timelineProgresses: number[];
};

type CameraTimelinePoint = {
  center: [number, number];
  finalZoom: number;
  routeZoom: number;
  offset: [number, number];
};

const cameraTimelinePoints: CameraTimelinePoint[] = [
  {
    center: parisCenter,
    finalZoom: parisFinalZoom,
    routeZoom: 2.35,
    offset: [-0.2, -0.14],
  },
  {
    center: guangzhouCenter,
    finalZoom: guangzhouFinalZoom,
    routeZoom: guangzhouRouteZoom,
    offset: [0.22, -0.16],
  },
  {
    center: hongKongCenter,
    finalZoom: hongKongFinalZoom,
    routeZoom: hongKongRouteZoom,
    offset: [0.24, 0.18],
  },
  {
    center: hongKongCenter,
    finalZoom: 11.25,
    routeZoom: 10.4,
    offset: [0.24, 0.18],
  },
  {
    center: [105.7042, 18.3559],
    finalZoom: 8.8,
    routeZoom: 5.2,
    offset: [0.2, -0.08],
  },
  {
    center: [113.5439, 22.1987],
    finalZoom: 11,
    routeZoom: 5.5,
    offset: [0.23, 0.2],
  },
  {
    center: [106.313, 22.833],
    finalZoom: 9.8,
    routeZoom: 6,
    offset: [0.16, -0.16],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.2,
    routeZoom: 8,
    offset: [0.2, -0.1],
  },
  {
    center: [105.834, 21.0368],
    finalZoom: 11.8,
    routeZoom: 10.2,
    offset: [0.22, -0.08],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.4,
    routeZoom: 9.2,
    offset: [0.17, -0.16],
  },
  {
    center: [105.2573, 22.1469],
    finalZoom: 9.7,
    routeZoom: 7.8,
    offset: [0.16, -0.18],
  },
  {
    center: [103.0169, 21.386],
    finalZoom: 9.2,
    routeZoom: 7,
    offset: [0.12, -0.08],
  },
  {
    center: [6.1432, 46.2044],
    finalZoom: 10.8,
    routeZoom: 3.1,
    offset: [0.18, -0.14],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.1,
    routeZoom: 3.1,
    offset: [0.2, -0.1],
  },
  {
    center: [106.7009, 10.7769],
    finalZoom: 9.8,
    routeZoom: 5.6,
    offset: [0.22, 0.12],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.2,
    routeZoom: 5.7,
    offset: [0.18, -0.12],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.8,
    routeZoom: 9.8,
    offset: [0.2, -0.1],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 11,
    routeZoom: 10,
    offset: [0.18, -0.04],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 10.8,
    routeZoom: 9.8,
    offset: [0.2, -0.1],
  },
  {
    center: [105.8342, 21.0278],
    finalZoom: 11.2,
    routeZoom: 10,
    offset: [0.18, -0.12],
  },
];

const northOverlayStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
    vietnam: {
      type: "geojson",
      data: vietnamGeoJsonPath,
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.24,
        "raster-contrast": -0.08,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.92,
      },
    },
    {
      id: "vietnam-line-shadow",
      type: "line",
      source: "vietnam",
      paint: {
        "line-color": "#f6fff3",
        "line-opacity": 0.78,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2.4, 8, 4.6],
      },
    },
    {
      id: "vietnam-line",
      type: "line",
      source: "vietnam",
      paint: {
        "line-color": "#0c514e",
        "line-opacity": 0.92,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.2, 8, 2.2],
      },
    },
  ],
};

function browserSupportsWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function getExteriorRings(data: GeoJsonFeatureCollection) {
  return data.features.flatMap((feature) => {
    const geometry = feature.geometry;

    if (!geometry) {
      return [];
    }

    if (geometry.type === "Polygon") {
      return [geometry.coordinates[0]].filter(Boolean);
    }

    return geometry.coordinates
      .map((polygon) => polygon[0])
      .filter((ring): ring is GeoJsonRing => Boolean(ring));
  });
}

function ringToTwoDimensionalCoordinates(ring: GeoJsonRing): [number, number][] {
  return ring.map(([lon, lat]) => [lon, lat]);
}

function ringToClipPath(map: Map, ring: GeoJsonRing) {
  if (ring.length < 3) {
    return "";
  }

  const points = ring.map((coordinate) => {
    const point = map.project([coordinate[0], coordinate[1]]);
    return `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  });

  return `M ${points.join(" L ")} Z`;
}

function createVietnamClipPath(map: Map, data: GeoJsonFeatureCollection) {
  return getExteriorRings(data).map((ring) => ringToClipPath(map, ring)).join(" ");
}

function applyVietnamClipPath(
  map: Map,
  container: HTMLElement,
  data: GeoJsonFeatureCollection,
) {
  const path = createVietnamClipPath(map, data);
  const clipPath = path ? `path("${path}")` : "";

  container.style.clipPath = clipPath;
  container.style.setProperty("-webkit-clip-path", clipPath);
}

function createOutsideVietnamMask(
  data: GeoJsonFeatureCollection,
): MaskGeoJsonFeatureCollection {
  const worldRing: [number, number][] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];

  const vietnamHoles = getExteriorRings(data).map(ringToTwoDimensionalCoordinates);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [worldRing, ...vietnamHoles],
        },
      },
    ],
  };
}

async function fetchVietnamGeoJson() {
  const response = await fetch(vietnamGeoJsonPath);

  if (!response.ok) {
    throw new Error(`Khong tai duoc ${vietnamGeoJsonPath}: ${response.status}`);
  }

  return (await response.json()) as GeoJsonFeatureCollection;
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Khong tai duoc anh ${src}.`));
    image.src = src;
  });
}

async function loadMaskPatternImage(map: Map, container: HTMLElement) {
  const image = await loadImageElement(outsideVietnamPatternPath);
  const width = Math.max(Math.ceil(container.clientWidth), 1);
  const height = Math.max(Math.ceil(container.clientHeight), 1);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Khong tao duoc canvas cho anh nen mask.");
  }

  canvas.width = width;
  canvas.height = height;

  const imageRatio = image.width / image.height;
  const containerRatio = width / height;
  const drawHeight = imageRatio > containerRatio ? height : width / imageRatio;
  const drawWidth = imageRatio > containerRatio ? height * imageRatio : width;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const patternImage = context.getImageData(0, 0, width, height);

  if (map.hasImage(outsideVietnamPatternId)) {
    map.updateImage(outsideVietnamPatternId, patternImage);
    return;
  }

  map.addImage(outsideVietnamPatternId, patternImage);
}

function getBoundsPadding(width: number, height: number) {
  const shortestSide = Math.min(width, height);
  const basePadding = Math.max(20, Math.min(72, shortestSide * 0.08));

  return {
    top: basePadding,
    bottom: basePadding * 0.62,
    left: width < 768 ? basePadding * 1.75 : basePadding * 2.45,
    right: basePadding * 0.35,
  };
}

function fitNorthView(map: Map, container: HTMLElement) {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  map.fitBounds(northViewBounds, {
    padding: getBoundsPadding(width, height),
    offset: [width < 768 ? width * 0.006 : width * 0.009, 0],
    pitch: 0,
    bearing: 0,
    duration: 0,
    maxZoom: width < 768 ? 6.05 : 6.55,
  });
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeInOut(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function applyParisCamera(map: Map, progress: number) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  if (clampedProgress <= 0) {
    return;
  }

  const zoomOutProgress = Math.min(clampedProgress / 0.36, 1);
  const parisProgress = Math.max((clampedProgress - 0.12) / 0.88, 0);
  const centerProgress = easeInOut(parisProgress);
  const zoomInProgress = easeInOut(
    Math.min(Math.max((clampedProgress - 0.36) / 0.64, 0), 1),
  );
  const zoom =
    clampedProgress < 0.36
      ? lerp(6.15, 2.35, zoomOutProgress)
      : lerp(2.35, parisFinalZoom, zoomInProgress);
  const canvas = map.getCanvas();
  const offset: [number, number] = [
    -canvas.clientWidth * 0.2 * clampedProgress,
    -canvas.clientHeight * 0.14 * clampedProgress,
  ];

  map.easeTo({
    center: [
      lerp(initialCenter[0], parisCenter[0], centerProgress),
      lerp(initialCenter[1], parisCenter[1], centerProgress),
    ],
    zoom,
    offset,
    pitch: 0,
    bearing: 0,
    duration: 0,
    essential: true,
  });
}

function applyGuangzhouCamera(map: Map, progress: number) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const centerProgress = easeInOut(clampedProgress);
  const zoomProgress =
    clampedProgress < 0.5
      ? easeInOut(clampedProgress / 0.5)
      : easeInOut((clampedProgress - 0.5) / 0.5);
  const zoom =
    clampedProgress < 0.5
      ? lerp(parisFinalZoom, guangzhouRouteZoom, zoomProgress)
      : lerp(guangzhouRouteZoom, guangzhouFinalZoom, zoomProgress);
  const canvas = map.getCanvas();
  const offsetProgress = easeInOut(clampedProgress);
  const offset: [number, number] = [
    canvas.clientWidth * lerp(-0.2, 0.22, offsetProgress),
    canvas.clientHeight * lerp(-0.14, -0.16, offsetProgress),
  ];

  map.easeTo({
    center: [
      lerp(parisCenter[0], guangzhouCenter[0], centerProgress),
      lerp(parisCenter[1], guangzhouCenter[1], centerProgress),
    ],
    zoom,
    offset,
    pitch: 0,
    bearing: 0,
    duration: 0,
    essential: true,
  });
}

function applyHongKongCamera(map: Map, progress: number) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const centerProgress = easeInOut(clampedProgress);
  const zoomProgress =
    clampedProgress < 0.5
      ? easeInOut(clampedProgress / 0.5)
      : easeInOut((clampedProgress - 0.5) / 0.5);
  const zoom =
    clampedProgress < 0.5
      ? lerp(guangzhouFinalZoom, hongKongRouteZoom, zoomProgress)
      : lerp(hongKongRouteZoom, hongKongFinalZoom, zoomProgress);
  const canvas = map.getCanvas();
  const offsetProgress = easeInOut(clampedProgress);
  const offset: [number, number] = [
    canvas.clientWidth * lerp(0.22, 0.24, offsetProgress),
    canvas.clientHeight * lerp(-0.16, 0.18, offsetProgress),
  ];

  map.easeTo({
    center: [
      lerp(guangzhouCenter[0], hongKongCenter[0], centerProgress),
      lerp(guangzhouCenter[1], hongKongCenter[1], centerProgress),
    ],
    zoom,
    offset,
    pitch: 0,
    bearing: 0,
    duration: 0,
    essential: true,
  });
}

function applyTimelinePointCamera(map: Map, index: number, progress: number) {
  const currentPoint = cameraTimelinePoints[index];
  const previousPoint = cameraTimelinePoints[index - 1];

  if (!currentPoint) {
    return;
  }

  if (!previousPoint) {
    applyParisCamera(map, progress);
    return;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const centerProgress = easeInOut(clampedProgress);
  const zoomProgress =
    clampedProgress < 0.5
      ? easeInOut(clampedProgress / 0.5)
      : easeInOut((clampedProgress - 0.5) / 0.5);
  const zoom =
    clampedProgress < 0.5
      ? lerp(previousPoint.finalZoom, currentPoint.routeZoom, zoomProgress)
      : lerp(currentPoint.routeZoom, currentPoint.finalZoom, zoomProgress);
  const canvas = map.getCanvas();
  const offsetProgress = easeInOut(clampedProgress);
  const offset: [number, number] = [
    canvas.clientWidth *
      lerp(previousPoint.offset[0], currentPoint.offset[0], offsetProgress),
    canvas.clientHeight *
      lerp(previousPoint.offset[1], currentPoint.offset[1], offsetProgress),
  ];

  map.easeTo({
    center: [
      lerp(previousPoint.center[0], currentPoint.center[0], centerProgress),
      lerp(previousPoint.center[1], currentPoint.center[1], centerProgress),
    ],
    zoom,
    offset,
    pitch: 0,
    bearing: 0,
    duration: 0,
    essential: true,
  });
}

function applyTimelineCamera(map: Map, progress: CameraTimelineProgress) {
  if (progress.timelineProgresses.length > 0) {
    let activeIndex = -1;

    progress.timelineProgresses.forEach((eventProgress, index) => {
      if (eventProgress > 0) {
        activeIndex = index;
      }
    });

    if (activeIndex >= 0) {
      applyTimelinePointCamera(
        map,
        activeIndex,
        progress.timelineProgresses[activeIndex],
      );
    }

    return;
  }

  if (progress.hongKongProgress > 0) {
    applyHongKongCamera(map, progress.hongKongProgress);
    return;
  }

  if (progress.guangzhouProgress > 0) {
    applyGuangzhouCamera(map, progress.guangzhouProgress);
    return;
  }

  applyParisCamera(map, progress.parisProgress);
}

function parseCameraProgress(detail: unknown): CameraTimelineProgress {
  if (typeof detail === "number") {
    return {
      parisProgress: detail,
      guangzhouProgress: 0,
      hongKongProgress: 0,
      timelineProgresses: [],
    };
  }

  if (detail && typeof detail === "object") {
    const progress = detail as Partial<CameraTimelineProgress>;

    return {
      parisProgress:
        typeof progress.parisProgress === "number" ? progress.parisProgress : 0,
      guangzhouProgress:
        typeof progress.guangzhouProgress === "number"
          ? progress.guangzhouProgress
          : 0,
      hongKongProgress:
        typeof progress.hongKongProgress === "number"
          ? progress.hongKongProgress
          : 0,
      timelineProgresses: Array.isArray(progress.timelineProgresses)
        ? progress.timelineProgresses.filter(
            (eventProgress): eventProgress is number =>
              typeof eventProgress === "number",
          )
        : [],
    };
  }

  return {
    parisProgress: 0,
    guangzhouProgress: 0,
    hongKongProgress: 0,
    timelineProgresses: [],
  };
}

type NorthMapSceneProps = {
  className?: string;
  clipToVietnam?: boolean;
  enableParisScroll?: boolean;
};

export default function NorthMapScene({
  className = "",
  clipToVietnam = false,
  enableParisScroll = false,
}: NorthMapSceneProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const container = mapContainerRef.current;
    const reportMapError = (message: string) => {
      queueMicrotask(() => {
        setMapError(message);
      });
    };

    if (!browserSupportsWebGl()) {
      reportMapError("Trinh duyet hoac GPU khong ho tro WebGL de render MapLibre.");
      return;
    }

    let map: Map;

    try {
      map = new maplibregl.Map({
        container,
        style: northOverlayStyle,
        center: initialCenter,
        zoom: 6.25,
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
      });
    } catch (error) {
      reportMapError(
        error instanceof Error
          ? error.message
          : "Khong khoi tao duoc ban do MapLibre.",
      );
      return;
    }

    mapRef.current = map;
    let vietnamDataForClip: GeoJsonFeatureCollection | null = null;
    let cameraProgress: CameraTimelineProgress = {
      parisProgress: 0,
      guangzhouProgress: 0,
      hongKongProgress: 0,
      timelineProgresses: [],
    };
    let isDisposed = false;

    const resizeMap = () => {
      map.resize();
      if (
        enableParisScroll &&
        (cameraProgress.parisProgress > 0 ||
          cameraProgress.guangzhouProgress > 0 ||
          cameraProgress.hongKongProgress > 0 ||
          cameraProgress.timelineProgresses.some((eventProgress) => eventProgress > 0))
      ) {
        applyTimelineCamera(map, cameraProgress);
        return;
      }

      fitNorthView(map, container);

      if (clipToVietnam && vietnamDataForClip) {
        applyVietnamClipPath(map, container, vietnamDataForClip);
      }
    };

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);

    const handleParisProgress = (event: Event) => {
      if (!enableParisScroll) {
        return;
      }

      cameraProgress =
        event instanceof CustomEvent
          ? parseCameraProgress(event.detail)
          : {
              parisProgress: 0,
              guangzhouProgress: 0,
              hongKongProgress: 0,
              timelineProgresses: [],
            };

      if (
        cameraProgress.parisProgress > 0 ||
        cameraProgress.guangzhouProgress > 0 ||
        cameraProgress.hongKongProgress > 0 ||
        cameraProgress.timelineProgresses.some((eventProgress) => eventProgress > 0)
      ) {
        container.style.clipPath = "";
        container.style.removeProperty("-webkit-clip-path");
        applyTimelineCamera(map, cameraProgress);
        return;
      }

      fitNorthView(map, container);

      if (clipToVietnam && vietnamDataForClip) {
        applyVietnamClipPath(map, container, vietnamDataForClip);
      }
    };

    window.addEventListener(parisCameraProgressEvent, handleParisProgress);

    map.on("load", () => {
      const maskAssets = clipToVietnam
        ? Promise.resolve()
        : loadMaskPatternImage(map, container);

      Promise.all([fetchVietnamGeoJson(), maskAssets])
        .then(([vietnamData]) => {
          if (isDisposed) {
            return;
          }

          vietnamDataForClip = vietnamData;
          fitNorthView(map, container);

          if (clipToVietnam) {
            applyVietnamClipPath(map, container, vietnamData);
          } else {
            map.addSource("outside-vietnam-mask", {
              type: "geojson",
              data: createOutsideVietnamMask(vietnamData),
            });
            map.addLayer(
              {
                id: "outside-vietnam-fill",
                type: "fill",
                source: "outside-vietnam-mask",
                paint: {
                  "fill-pattern": outsideVietnamPatternId,
                  "fill-opacity": 0.92,
                },
              },
              "vietnam-line-shadow",
            );
          }

          setIsLoaded(true);
        })
        .catch((error: unknown) => {
          if (isDisposed) {
            return;
          }

          setMapError(
            error instanceof Error
              ? error.message
              : "Khong tao duoc lop phu xam ngoai Viet Nam.",
          );
        });
    });

    map.on("error", (event) => {
      const detail = event.error?.message;
      setMapError(
        detail
          ? `Khong tai duoc ban do hoac du lieu GeoJSON: ${detail}`
          : "Khong tai duoc ban do hoac du lieu GeoJSON.",
      );
    });

    return () => {
      isDisposed = true;
      window.removeEventListener(parisCameraProgressEvent, handleParisProgress);
      resizeObserver.disconnect();
      container.style.clipPath = "";
      container.style.removeProperty("-webkit-clip-path");
      map.remove();
      mapRef.current = null;
    };
  }, [clipToVietnam, enableParisScroll]);

  return (
    <div
      className={`relative overflow-hidden text-[#17302d] ${
        clipToVietnam ? "bg-[#e8ddbf]" : "bg-[#dfe4dc]"
      } ${className}`}
      style={clipToVietnam ? { backgroundColor: clippedMapBackground } : undefined}
    >
        <div
          ref={mapContainerRef}
          className={`h-full w-full ${
            clipToVietnam ? "bg-[#e8ddbf]" : "bg-[#dfe4dc]"
          }`}
          style={clipToVietnam ? { backgroundColor: clippedMapBackground } : undefined}
        />

        {!clipToVietnam ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[#eed8a5]/16 mix-blend-multiply" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,transparent_0%,transparent_58%,rgb(71_58_36_/_0.16)_100%)]" />
          </>
        ) : null}

        {!clipToVietnam && !isLoaded && !mapError ? (
          <div className="absolute left-4 top-4 rounded-md border border-white/45 bg-white/76 px-3 py-2 text-sm text-[#25433e] shadow-sm backdrop-blur">
            Dang tai ban do mien Bac...
          </div>
        ) : null}

        {mapError ? (
          <div className="absolute inset-x-4 top-4 rounded-md border border-[#d99a88] bg-[#fff3ee] p-3 text-sm text-[#7b2e1b] shadow">
            {mapError}
          </div>
        ) : null}

        {!clipToVietnam ? (
        <p className="pointer-events-none absolute bottom-3 right-3 max-w-[calc(100vw-1.5rem)] rounded bg-[#f8f5eb]/82 px-2 py-1 text-[11px] leading-4 text-[#495b55] shadow-sm backdrop-blur">
          © OpenStreetMap contributors · Boundaries: geoBoundaries VNM CC BY
          4.0, CHN Public Domain
        </p>
        ) : null}
    </div>
  );
}
