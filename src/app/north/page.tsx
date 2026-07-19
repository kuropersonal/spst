"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

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

const DATASETS = {
  vietnam: "/data/geo/vietnam.geojson",
  china: "/data/geo/china.geojson",
};

const PROJECTION = {
  west: 94,
  east: 125,
  south: 8,
  north: 43,
  centerLon: 108.5,
  centerLat: 24,
};

const NORTH_VIEW_BOUNDS = {
  west: 101.2,
  east: 110.6,
  south: 17.6,
  north: 24.2,
};

const WORLD_HEIGHT = 7;
const LAT_SCALE = WORLD_HEIGHT / (PROJECTION.north - PROJECTION.south);
const LON_SCALE =
  LAT_SCALE *
  Math.cos((((PROJECTION.south + PROJECTION.north) / 2) * Math.PI) / 180);

const VIETNAM_HEIGHT = 0.12;
const CHINA_HEIGHT = 0.02;

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

function projectLonLat([lon, lat]: LonLat) {
  return new THREE.Vector2(
    (lon - PROJECTION.centerLon) * LON_SCALE,
    (lat - PROJECTION.centerLat) * LAT_SCALE,
  );
}

function projectedPoint(lon: number, lat: number, z = 0) {
  const point = projectLonLat([lon, lat]);
  return new THREE.Vector3(point.x, point.y, z);
}

function cleanProjectedRing(ring: GeoJsonRing) {
  const projected = ring.map(projectLonLat);
  const first = projected[0];
  const last = projected.at(-1);

  if (first && last && first.distanceToSquared(last) < 0.0000001) {
    projected.pop();
  }

  return projected.length >= 3 ? projected : [];
}

function geometryToPolygons(data: GeoJsonFeatureCollection) {
  return data.features.flatMap((feature) => {
    const geometry = feature.geometry;

    if (!geometry) {
      return [];
    }

    if (geometry.type === "Polygon") {
      return [geometry.coordinates];
    }

    return geometry.coordinates;
  });
}

function polygonToShapes(polygon: GeoJsonPolygon) {
  const outer = cleanProjectedRing(polygon[0] ?? []);

  if (outer.length < 3) {
    return [];
  }

  if (!THREE.ShapeUtils.isClockWise(outer)) {
    outer.reverse();
  }

  const shape = new THREE.Shape(outer);

  polygon.slice(1).forEach((ring) => {
    const hole = cleanProjectedRing(ring);

    if (hole.length < 3) {
      return;
    }

    if (THREE.ShapeUtils.isClockWise(hole)) {
      hole.reverse();
    }

    shape.holes.push(new THREE.Path(hole));
  });

  return [shape];
}

function createBoundaryLines(polygons: GeoJsonPolygon[], z: number, color: number) {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.45,
  });

  polygons.forEach((polygon) => {
    polygon.forEach((ring, index) => {
      const projected = cleanProjectedRing(ring);

      if (projected.length < 3) {
        return;
      }

      const points = projected.map((point) => new THREE.Vector3(point.x, point.y, z));
      points.push(points[0].clone());

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.renderOrder = index === 0 ? 3 : 2;
      group.add(line);
    });
  });

  return group;
}

function createCountryMesh({
  polygons,
  depth,
  material,
  bevelEnabled,
}: {
  polygons: GeoJsonPolygon[];
  depth: number;
  material: THREE.Material | THREE.Material[];
  bevelEnabled: boolean;
}) {
  const shapes = polygons.flatMap(polygonToShapes);
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled,
    bevelSegments: bevelEnabled ? 2 : 0,
    bevelSize: bevelEnabled ? 0.018 : 0,
    bevelThickness: bevelEnabled ? 0.025 : 0,
    curveSegments: 2,
  });

  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function createPaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#eadfc6";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3600; i += 1) {
    const alpha = 0.035 + Math.random() * 0.055;
    const shade = Math.random() > 0.5 ? "88 66 36" : "255 250 229";
    context.fillStyle = `rgb(${shade} / ${alpha})`;
    context.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1 + Math.random() * 2,
      1 + Math.random() * 2,
    );
  }

  const gradient = context.createRadialGradient(300, 280, 80, 360, 360, 560);
  gradient.addColorStop(0, "rgb(255 246 219 / 0.24)");
  gradient.addColorStop(0.55, "rgb(221 191 139 / 0.11)");
  gradient.addColorStop(1, "rgb(130 83 44 / 0.18)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.35, 1.1);

  return texture;
}

function createContourLines() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xb58e50,
    transparent: true,
    opacity: 0.26,
  });
  const contourSets = [
    { lon: 102.2, lat: 23.4, width: 3.0, height: 1.4, rotation: -0.18 },
    { lon: 104.3, lat: 20.6, width: 2.7, height: 1.15, rotation: 0.28 },
    { lon: 108.7, lat: 18.7, width: 2.4, height: 0.9, rotation: -0.12 },
    { lon: 109.6, lat: 23.1, width: 2.0, height: 0.8, rotation: 0.34 },
  ];

  contourSets.forEach((set) => {
    const center = projectLonLat([set.lon, set.lat]);

    for (let index = 0; index < 6; index += 1) {
      const curve = new THREE.EllipseCurve(
        center.x,
        center.y,
        set.width * (0.55 + index * 0.13),
        set.height * (0.55 + index * 0.13),
        0,
        Math.PI * 2,
        false,
        set.rotation,
      );
      const points = curve
        .getPoints(120)
        .map((point) => new THREE.Vector3(point.x, point.y, -0.032));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      group.add(new THREE.Line(geometry, material));
    }
  });

  return group;
}

function configureCamera(
  camera: THREE.OrthographicCamera,
  width: number,
  height: number,
) {
  const aspect = Math.max(width / Math.max(height, 1), 0.1);
  const west = projectLonLat([NORTH_VIEW_BOUNDS.west, NORTH_VIEW_BOUNDS.south]);
  const east = projectLonLat([NORTH_VIEW_BOUNDS.east, NORTH_VIEW_BOUNDS.north]);
  const target = projectedPoint(105.8, 21.35, 0);
  const viewWidth = Math.abs(east.x - west.x) * 1.08;
  const viewHeight = Math.abs(east.y - west.y) * 1.14;
  let halfWidth = viewWidth / 2;
  let halfHeight = viewHeight / 2;

  if (halfWidth / halfHeight > aspect) {
    halfHeight = halfWidth / aspect;
  } else {
    halfWidth = halfHeight * aspect;
  }

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.position.set(target.x, target.y, 10);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

function disposeScene(scene: THREE.Scene) {
  const disposeMaterial = (material: THREE.Material) => {
    const mappedMaterial = material as THREE.Material & { map?: THREE.Texture };
    mappedMaterial.map?.dispose();
    material.dispose();
  };

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      object.geometry.dispose();

      const material = object.material;

      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else {
        disposeMaterial(material);
      }
    }
  });
}

async function fetchGeoJson(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Khong tai duoc ${url}: ${response.status}`);
  }

  return (await response.json()) as GeoJsonFeatureCollection;
}

export default function NorthReliefPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!browserSupportsWebGl()) {
      queueMicrotask(() => {
        setSceneError("Trinh duyet hoac GPU khong ho tro WebGL de render Three.js.");
      });
      return;
    }

    let isDisposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeadfc6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
    const sceneGroup = new THREE.Group();
    sceneGroup.rotation.z = THREE.MathUtils.degToRad(-1.5);
    scene.add(sceneGroup);

    const ambientLight = new THREE.AmbientLight(0xfff6e4, 2.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.position.set(-1.8, -2.4, 5.4);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 14;
    scene.add(directionalLight);

    const fillLight = new THREE.HemisphereLight(0xf7efe1, 0xb7a986, 1.3);
    scene.add(fillLight);

    const paperTexture = createPaperTexture();
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 7),
      new THREE.MeshBasicMaterial({
        color: 0xeadfc6,
        map: paperTexture,
      }),
    );
    plane.position.copy(projectedPoint(105.8, 21.3, -0.055));
    plane.receiveShadow = true;
    scene.add(plane);
    scene.add(createContourLines());

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);

      renderer.setSize(width, height, false);
      configureCamera(camera, width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frameId = 0;
    const renderFrame = () => {
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    Promise.all([fetchGeoJson(DATASETS.china), fetchGeoJson(DATASETS.vietnam)])
      .then(([chinaData, vietnamData]) => {
        if (isDisposed) {
          return;
        }

        const chinaPolygons = geometryToPolygons(chinaData);
        const vietnamPolygons = geometryToPolygons(vietnamData);

        const chinaMaterial = new THREE.MeshStandardMaterial({
          color: 0xbec9bd,
          roughness: 1,
          metalness: 0.02,
          transparent: true,
          opacity: 0.5,
        });
        const vietnamTopMaterial = new THREE.MeshStandardMaterial({
          color: 0x3f7068,
          roughness: 0.96,
          metalness: 0.02,
        });
        const vietnamSideMaterial = new THREE.MeshStandardMaterial({
          color: 0x2f5b56,
          roughness: 0.94,
          metalness: 0.04,
        });

        const chinaMesh = createCountryMesh({
          polygons: chinaPolygons,
          depth: CHINA_HEIGHT,
          material: chinaMaterial,
          bevelEnabled: false,
        });
        const vietnamMesh = createCountryMesh({
          polygons: vietnamPolygons,
          depth: VIETNAM_HEIGHT,
          material: [vietnamTopMaterial, vietnamSideMaterial],
          bevelEnabled: true,
        });

        sceneGroup.add(chinaMesh);
        sceneGroup.add(createBoundaryLines(chinaPolygons, CHINA_HEIGHT + 0.006, 0x7f8b7b));
        sceneGroup.add(vietnamMesh);
        sceneGroup.add(
          createBoundaryLines(vietnamPolygons, VIETNAM_HEIGHT + 0.012, 0xeaf6e5),
        );

        setIsReady(true);
        renderFrame();
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        setSceneError(
          error instanceof Error
            ? error.message
            : "Khong khoi tao duoc relief scene.",
        );
      });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#dfe7e0] text-[#18302d]">
      <section className="relative h-screen w-screen overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {!isReady && !sceneError ? (
          <div className="absolute left-4 top-4 rounded-md border border-white/45 bg-white/72 px-3 py-2 text-sm text-[#25433e] shadow-sm backdrop-blur">
            Dang tai du lieu relief...
          </div>
        ) : null}

        {sceneError ? (
          <div className="absolute inset-x-4 top-4 rounded-md border border-[#d99a88] bg-[#fff3ee] p-3 text-sm text-[#7b2e1b] shadow">
            {sceneError}
          </div>
        ) : null}

        <p className="pointer-events-none absolute bottom-3 right-3 max-w-[calc(100vw-1.5rem)] rounded bg-[#f8f5eb]/78 px-2 py-1 text-[11px] leading-4 text-[#495b55] shadow-sm backdrop-blur">
          Boundaries: geoBoundaries VNM CC BY 4.0, CHN Public Domain
        </p>
      </section>
    </main>
  );
}
