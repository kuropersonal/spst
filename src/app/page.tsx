"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, {
  Map,
  Marker,
  Popup,
  type StyleSpecification,
} from "maplibre-gl";

type HistoricalPlace = {
  id: string;
  name: string;
  event: string;
  year: string;
  description: string;
  coordinates: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
};

type DebugEntry = {
  id: number;
  level: "info" | "warn" | "error";
  message: string;
  detail?: string;
};

const historicalPlaces: HistoricalPlace[] = [
  {
    id: "ba-dinh",
    name: "Quảng trường Ba Đình",
    event: "Tuyên ngôn Độc lập",
    year: "2/9/1945",
    description:
      "Nơi Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.",
    coordinates: [105.83466, 21.03687],
    zoom: 16.3,
    pitch: 62,
    bearing: -32,
  },
  {
    id: "phu-chu-tich",
    name: "Phủ Chủ tịch",
    event: "Trung tâm chính trị Ba Đình",
    year: "Sau 1945",
    description:
      "Khu vực gắn với hoạt động lãnh đạo nhà nước và nhiều dấu mốc chính trị tại Hà Nội.",
    coordinates: [105.83413, 21.03928],
    zoom: 16.4,
    pitch: 60,
    bearing: -18,
  },
  {
    id: "ho-guom",
    name: "Hồ Gươm",
    event: "Không gian lịch sử trung tâm Hà Nội",
    year: "1945 - nay",
    description:
      "Một mốc nhận diện đô thị quan trọng khi xem các sự kiện lịch sử diễn ra ở trung tâm Hà Nội.",
    coordinates: [105.85237, 21.02866],
    zoom: 15.7,
    pitch: 58,
    bearing: -28,
  },
];

const initialView = {
  center: [105.8432, 21.032] as [number, number],
  zoom: 14.7,
  pitch: 60,
  bearing: -25,
};

const freeHanoiStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-base",
      type: "raster",
      source: "osm",
    },
  ],
};

function formatUnknownError(error: unknown) {
  if (error instanceof Error) {
    return [error.message, error.stack].filter(Boolean).join("\n");
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

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

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [activePlaceId, setActivePlaceId] = useState(historicalPlaces[0].id);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);

  const activePlace = useMemo(
    () => historicalPlaces.find((place) => place.id === activePlaceId),
    [activePlaceId],
  );

  const addDebugEntry = useCallback(
    (level: DebugEntry["level"], message: string, detail?: unknown) => {
      const entry: DebugEntry = {
        id: Date.now() + Math.random(),
        level,
        message,
        detail: detail === undefined ? undefined : formatUnknownError(detail),
      };

      setDebugEntries((entries) => [...entries.slice(-11), entry]);

      const consoleMethod =
        level === "error" ? console.error : level === "warn" ? console.warn : console.info;

      consoleMethod(`[Map debug] ${message}`, detail ?? "");
    },
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const container = mapContainerRef.current;
    const rect = container.getBoundingClientRect();
    const webGlSupported = browserSupportsWebGl();

    addDebugEntry("info", "Chuẩn bị khởi tạo MapLibre", {
      containerWidth: Math.round(rect.width),
      containerHeight: Math.round(rect.height),
      webGlSupported,
      center: initialView.center,
      zoom: initialView.zoom,
    });

    if (!webGlSupported) {
      setMapError("Trình duyệt hoặc GPU không hỗ trợ WebGL để render MapLibre.");
      addDebugEntry("error", "MapLibre báo WebGL không được hỗ trợ");
      return;
    }

    let map: Map;

    try {
      map = new maplibregl.Map({
        container,
        style: freeHanoiStyle,
        center: initialView.center,
        zoom: initialView.zoom,
        pitch: initialView.pitch,
        bearing: initialView.bearing,
        attributionControl: false,
      });
    } catch (error) {
      setMapError("MapLibre không khởi tạo được. Xem bảng debug bên dưới.");
      addDebugEntry("error", "Exception khi tạo map", error);
      return;
    }

    mapRef.current = map;
    addDebugEntry("info", "Đã tạo MapLibre instance");

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "OpenFreeMap",
      }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right",
    );

    const resizeMap = () => map.resize();
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);
    window.setTimeout(resizeMap, 250);

    map.on("load", () => {
      addDebugEntry("info", "Map load xong");
      setIsLoaded(true);
    });

    map.on("styledata", () => {
      addDebugEntry("info", "Style data đã tải");
    });

    map.on("sourcedata", (event) => {
      if (event.sourceId === "osm") {
        addDebugEntry("info", `Source event: ${event.sourceId}`, {
          dataType: event.dataType,
          sourceDataType: event.sourceDataType,
          isSourceLoaded: event.isSourceLoaded,
        });
      }
    });

    map.on("styleimagemissing", (event) => {
      addDebugEntry("warn", `Style thiếu icon: ${event.id}`);
    });

    map.on("error", (event) => {
      setMapError("Không tải được bản đồ nền. Xem bảng debug bên dưới.");
      addDebugEntry("error", "MapLibre error event", event.error ?? event);
    });

    const handleWindowError = (event: ErrorEvent) => {
      addDebugEntry("error", "Browser runtime error", {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: formatUnknownError(event.error),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addDebugEntry("error", "Unhandled promise rejection", event.reason);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    map.once("idle", () => {
      const canvas = map.getCanvas();
      const canvasRect = canvas.getBoundingClientRect();

      addDebugEntry("info", "Map idle", {
        canvasWidth: Math.round(canvasRect.width),
        canvasHeight: Math.round(canvasRect.height),
        loaded: map.loaded(),
        styleLoaded: map.isStyleLoaded(),
        zoom: Number(map.getZoom().toFixed(2)),
        pitch: Number(map.getPitch().toFixed(2)),
      });
    });

    markersRef.current = historicalPlaces.map((place) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = "history-marker";
      markerElement.setAttribute("aria-label", `Xem ${place.name}`);
      markerElement.addEventListener("click", () => {
        setActivePlaceId(place.id);
      });

      const popup = new Popup({
        closeButton: false,
        offset: 18,
        className: "history-popup",
      }).setHTML(
        `<strong>${place.name}</strong><span>${place.year} - ${place.event}</span><p>${place.description}</p>`,
      );

      return new Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat(place.coordinates)
        .setPopup(popup)
        .addTo(map);
    });

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [addDebugEntry]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !activePlace) {
      return;
    }

    map.flyTo({
      center: activePlace.coordinates,
      zoom: activePlace.zoom,
      pitch: activePlace.pitch,
      bearing: activePlace.bearing,
      duration: 1300,
      essential: true,
    });
  }, [activePlace]);

  function resetView() {
    mapRef.current?.flyTo({
      ...initialView,
      duration: 1200,
      essential: true,
    });
    setActivePlaceId(historicalPlaces[0].id);
  }

  return (
    <main className="min-h-screen bg-[#f4f2ea] text-[#1d2520]">
      <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[380px_1fr] lg:grid-rows-1">
        <aside className="z-10 flex flex-col gap-5 border-b border-[#d8d3c4] bg-[#f8f6ef]/95 p-5 shadow-sm lg:border-b-0 lg:border-r lg:p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#69756c]">
              Demo bản đồ 2.5D
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[#16231d]">
              Một khu lịch sử tại Hà Nội
            </h1>
            <p className="text-sm leading-6 text-[#58635b]">
              Click từng mốc để camera nghiêng bay tới địa điểm chính xác trên bản
              đồ nền miễn phí.
            </p>
          </div>

          <div className="grid gap-3">
            {historicalPlaces.map((place) => {
              const isActive = place.id === activePlaceId;

              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => setActivePlaceId(place.id)}
                  className={`rounded-md border p-4 text-left transition ${
                    isActive
                      ? "border-[#1f6f54] bg-[#e8f0e8] text-[#10251d]"
                      : "border-[#ded8c8] bg-transparent text-[#27332d] hover:border-[#9da993] hover:bg-[#f0eee5]"
                  }`}
                >
                  <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[#657466]">
                    {place.year}
                  </span>
                  <span className="mt-1 block text-base font-semibold">
                    {place.name}
                  </span>
                  <span className="mt-2 block text-sm leading-5 text-[#59665d]">
                    {place.event}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetView}
              className="rounded-md bg-[#19342a] px-4 py-2 text-sm font-medium text-[#f9f6eb] transition hover:bg-[#254838]"
            >
              Reset góc nhìn
            </button>
            <span className="text-sm text-[#647067]">
              {isLoaded ? "MapLibre + OpenStreetMap" : "Đang tải bản đồ..."}
            </span>
          </div>

          {mapError ? (
            <p className="rounded-md border border-[#d99a88] bg-[#fff3ee] p-3 text-sm text-[#7b2e1b]">
              {mapError}
            </p>
          ) : null}

          <div className="max-h-64 overflow-auto rounded-md border border-[#ded8c8] bg-[#fffdf6] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#657466]">
                Debug map
              </p>
              <button
                type="button"
                onClick={() => setDebugEntries([])}
                className="rounded-md border border-[#cfc8b8] px-2 py-1 text-xs text-[#47544c] transition hover:bg-[#f0eee5]"
              >
                Xóa
              </button>
            </div>
            {debugEntries.length > 0 ? (
              <ol className="space-y-2">
                {debugEntries.map((entry) => (
                  <li key={entry.id} className="text-xs leading-5 text-[#47544c]">
                    <span
                      className={`font-semibold ${
                        entry.level === "error"
                          ? "text-[#9d2e1b]"
                          : entry.level === "warn"
                            ? "text-[#8a5b12]"
                            : "text-[#24614d]"
                      }`}
                    >
                      {entry.level.toUpperCase()}
                    </span>{" "}
                    {entry.message}
                    {entry.detail ? (
                      <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-[#f0eee5] p-2 font-mono text-[11px] leading-4 text-[#27332d]">
                        {entry.detail}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs leading-5 text-[#667268]">
                Chưa có log. Reload trang để bắt lại quá trình tải map.
              </p>
            )}
          </div>
        </aside>

        <section className="relative h-[70vh] min-h-[520px] overflow-hidden lg:h-screen lg:min-h-0">
          <div ref={mapContainerRef} className="h-full w-full bg-[#dfded5]" />
          <div className="pointer-events-none absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-md bg-[#15231d]/86 px-4 py-3 text-[#f8f3e5] shadow-lg backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#c9d3c7]">
              Đang xem
            </p>
            <p className="mt-1 text-sm font-semibold sm:text-base">
              {activePlace?.name}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
