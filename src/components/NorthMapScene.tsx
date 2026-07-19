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

type NorthMapSceneProps = {
  className?: string;
  clipToVietnam?: boolean;
};

export default function NorthMapScene({
  className = "",
  clipToVietnam = false,
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
    let isDisposed = false;

    const resizeMap = () => {
      map.resize();
      fitNorthView(map, container);

      if (clipToVietnam && vietnamDataForClip) {
        applyVietnamClipPath(map, container, vietnamDataForClip);
      }
    };

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);

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
      resizeObserver.disconnect();
      container.style.clipPath = "";
      container.style.removeProperty("-webkit-clip-path");
      map.remove();
      mapRef.current = null;
    };
  }, [clipToVietnam]);

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
