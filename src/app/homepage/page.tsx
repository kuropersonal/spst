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

type MapWindow = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const fullMapWindow: MapWindow = {
  left: 0,
  top: 0,
  width: 100,
  height: 100,
};

const initialFrameWindow: MapWindow = {
  left: 26,
  top: 15,
  width: 50,
  height: 75,
};

const parisMapWindow: MapWindow = {
  left: 10,
  top: 10,
  width: 40,
  height: 52,
};

const guangzhouMapWindow: MapWindow = {
  left: 58,
  top: 16,
  width: 28,
  height: 36,
};

const hongKongMapWindow: MapWindow = {
  left: 60,
  top: 40,
  width: 30,
  height: 34,
};

type TimelineEvent = {
  label: string;
  year: string;
  number: string;
  meta: string;
  title: string;
  description: string;
  coordinates: string;
  mapWindow: MapWindow;
  transitionVh: number;
};

const futureTimelineEvents: TimelineEvent[] = [
  {
    label: "Hương Cảng",
    year: "1930",
    number: "04",
    meta: "Hương Cảng · Tháng 10, 1930",
    title: "Thông qua Luận cương chính trị",
    description:
      "Hội nghị Trung ương thông qua Luận cương chính trị, bổ sung nền tảng lý luận và định hướng đấu tranh của Đảng trong giai đoạn đầu.",
    coordinates: "22.3193°N · 114.1694°E",
    mapWindow: hongKongMapWindow,
    transitionVh: 1.4,
  },
  {
    label: "Nghệ Tĩnh",
    year: "1930-31",
    number: "05",
    meta: "Nghệ An - Hà Tĩnh · 1930-1931",
    title: "Cao trào Xô viết Nghệ Tĩnh",
    description:
      "Phong trào công nông ở Nghệ An, Hà Tĩnh phát triển mạnh, thể hiện sức huy động quần chúng và năng lực lãnh đạo của tổ chức Đảng mới.",
    coordinates: "18.3559°N · 105.7042°E",
    mapWindow: { left: 57, top: 18, width: 30, height: 42 },
    transitionVh: 2.2,
  },
  {
    label: "Ma Cao",
    year: "1935",
    number: "06",
    meta: "Ma Cao · Tháng 3, 1935",
    title: "Đại hội đại biểu lần thứ nhất của Đảng",
    description:
      "Đại hội I diễn ra trong bối cảnh Đảng khôi phục tổ chức sau khủng bố trắng và phong trào 1930-1931.",
    coordinates: "22.1987°N · 113.5439°E",
    mapWindow: { left: 58, top: 42, width: 30, height: 34 },
    transitionVh: 2.2,
  },
  {
    label: "Pác Bó",
    year: "1941",
    number: "07",
    meta: "Pác Bó, Cao Bằng · Tháng 5, 1941",
    title: "Hội nghị Trung ương 8 và thành lập Việt Minh",
    description:
      "Hội nghị xác định giải phóng dân tộc là nhiệm vụ trung tâm, chuẩn bị trực tiếp cho Tổng khởi nghĩa Tháng Tám.",
    coordinates: "22.8330°N · 106.3130°E",
    mapWindow: { left: 54, top: 14, width: 32, height: 40 },
    transitionVh: 2.1,
  },
  {
    label: "Hà Nội",
    year: "1945",
    number: "08",
    meta: "Hà Nội · Tháng 8, 1945",
    title: "Cách mạng Tháng Tám",
    description:
      "Tổng khởi nghĩa giành chính quyền diễn ra trên cả nước, trong đó Hà Nội giành chính quyền ngày 19/8/1945.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 57, top: 18, width: 31, height: 40 },
    transitionVh: 1.8,
  },
  {
    label: "Ba Đình",
    year: "1945",
    number: "09",
    meta: "Quảng trường Ba Đình · 02/09/1945",
    title: "Đọc Tuyên ngôn Độc lập",
    description:
      "Chủ tịch Hồ Chí Minh tuyên bố thành lập nước Việt Nam Dân chủ Cộng hòa, mở ra kỷ nguyên độc lập dân tộc.",
    coordinates: "21.0368°N · 105.8340°E",
    mapWindow: { left: 59, top: 20, width: 29, height: 38 },
    transitionVh: 1.2,
  },
  {
    label: "Hà Nội",
    year: "1946",
    number: "10",
    meta: "Hà Nội · 19/12/1946",
    title: "Toàn quốc kháng chiến",
    description:
      "Lời kêu gọi Toàn quốc kháng chiến mở đầu cuộc kháng chiến chống thực dân Pháp trên phạm vi cả nước.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 55, top: 14, width: 32, height: 42 },
    transitionVh: 1.3,
  },
  {
    label: "Tuyên Quang",
    year: "1951",
    number: "11",
    meta: "Chiêm Hóa, Tuyên Quang · Tháng 2, 1951",
    title: "Đại hội II của Đảng",
    description:
      "Đại hội II đưa Đảng ra hoạt động công khai với tên Đảng Lao động Việt Nam trong bối cảnh kháng chiến chống Pháp.",
    coordinates: "22.1469°N · 105.2573°E",
    mapWindow: { left: 54, top: 12, width: 32, height: 40 },
    transitionVh: 1.7,
  },
  {
    label: "Điện Biên Phủ",
    year: "1954",
    number: "12",
    meta: "Điện Biên Phủ · 07/05/1954",
    title: "Chiến thắng Điện Biên Phủ",
    description:
      "Sau 55 ngày đêm chiến đấu, thắng lợi Điện Biên Phủ tạo bước ngoặt quyết định trong cuộc kháng chiến chống Pháp.",
    coordinates: "21.3860°N · 103.0169°E",
    mapWindow: { left: 52, top: 18, width: 34, height: 40 },
    transitionVh: 1.9,
  },
  {
    label: "Genève",
    year: "1954",
    number: "13",
    meta: "Genève · 21/07/1954",
    title: "Hiệp định Genève",
    description:
      "Hội nghị Genève ghi nhận các nguyên tắc độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ của Việt Nam.",
    coordinates: "46.2044°N · 6.1432°E",
    mapWindow: { left: 56, top: 14, width: 34, height: 44 },
    transitionVh: 2.9,
  },
  {
    label: "Hà Nội",
    year: "1960",
    number: "14",
    meta: "Hà Nội · Tháng 9, 1960",
    title: "Đại hội III của Đảng",
    description:
      "Đại hội III xác định nhiệm vụ cách mạng ở hai miền: xây dựng miền Bắc và đấu tranh thống nhất đất nước ở miền Nam.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 57, top: 18, width: 31, height: 40 },
    transitionVh: 2.7,
  },
  {
    label: "Sài Gòn",
    year: "1975",
    number: "15",
    meta: "Sài Gòn · 30/04/1975",
    title: "Đại thắng mùa Xuân 1975",
    description:
      "Chiến dịch Hồ Chí Minh kết thúc thắng lợi, miền Nam được giải phóng và mở đường cho thống nhất đất nước.",
    coordinates: "10.7769°N · 106.7009°E",
    mapWindow: { left: 58, top: 36, width: 31, height: 42 },
    transitionVh: 2.1,
  },
  {
    label: "Hà Nội",
    year: "1976",
    number: "16",
    meta: "Hà Nội · Tháng 12, 1976",
    title: "Đại hội IV của Đảng",
    description:
      "Đại hội IV diễn ra sau thống nhất, xác định đường lối xây dựng chủ nghĩa xã hội trong phạm vi cả nước.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 55, top: 16, width: 32, height: 42 },
    transitionVh: 2,
  },
  {
    label: "Hà Nội",
    year: "1986",
    number: "17",
    meta: "Hà Nội · 15-18/12/1986",
    title: "Đại hội VI và đường lối Đổi mới",
    description:
      "Đại hội VI xác lập quyết tâm đổi mới công tác lãnh đạo, quản lý và phát triển kinh tế - xã hội.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 57, top: 18, width: 31, height: 40 },
    transitionVh: 1.4,
  },
  {
    label: "Hà Nội",
    year: "1991",
    number: "18",
    meta: "Hà Nội · Tháng 6, 1991",
    title: "Cương lĩnh xây dựng đất nước",
    description:
      "Đại hội VII thông qua Cương lĩnh 1991, đưa ra khung định hướng chính trị cho giai đoạn sau Đổi mới.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 55, top: 20, width: 31, height: 38 },
    transitionVh: 1.3,
  },
  {
    label: "Hà Nội",
    year: "2011-21",
    number: "19",
    meta: "Hà Nội · 2011-2021",
    title: "Cương lĩnh bổ sung và văn kiện Đại hội XIII",
    description:
      "Các văn kiện tiếp tục nhấn mạnh xây dựng, chỉnh đốn Đảng, phát triển đất nước và hội nhập quốc tế.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 57, top: 18, width: 31, height: 40 },
    transitionVh: 1.4,
  },
  {
    label: "Hà Nội",
    year: "2026",
    number: "20",
    meta: "Hà Nội · 19-23/01/2026",
    title: "Đại hội XIV của Đảng",
    description:
      "Đại hội XIV là mốc cập nhật mới nhất của timeline, đặt ở phần kết cho dòng lịch sử hiện đại.",
    coordinates: "21.0278°N · 105.8342°E",
    mapWindow: { left: 55, top: 16, width: 34, height: 42 },
    transitionVh: 1.5,
  },
];

function easeInOut(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

function interpolateMapWindow(
  start: MapWindow,
  end: MapWindow,
  progress: number,
) {
  return {
    left: lerp(start.left, end.left, progress),
    top: lerp(start.top, end.top, progress),
    width: lerp(start.width, end.width, progress),
    height: lerp(start.height, end.height, progress),
  };
}

function mapWindowToClipPath(mapWindow: MapWindow) {
  return `inset(
    ${mapWindow.top}vh
    ${100 - mapWindow.left - mapWindow.width}vw
    ${100 - mapWindow.top - mapWindow.height}vh
    ${mapWindow.left}vw
  )`;
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
  const parisTextRef = useRef<HTMLDivElement | null>(null);
  const parisCardRef = useRef<HTMLDivElement | null>(null);
  const guangzhouTextRef = useRef<HTMLDivElement | null>(null);
  const guangzhouCardRef = useRef<HTMLDivElement | null>(null);
  const hongKongTextRef = useRef<HTMLDivElement | null>(null);
  const hongKongCardRef = useRef<HTMLDivElement | null>(null);
  const futureTextRefs = useRef<Array<HTMLDivElement | null>>([]);
  const futureCardRefs = useRef<Array<HTMLElement | null>>([]);

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
    const parisTextElement = parisTextRef.current;
    const parisCardElement = parisCardRef.current;
    const guangzhouTextElement = guangzhouTextRef.current;
    const guangzhouCardElement = guangzhouCardRef.current;
    const hongKongTextElement = hongKongTextRef.current;
    const hongKongCardElement = hongKongCardRef.current;
    const futureTextElements = futureTimelineEvents.map(
      (_, index) => futureTextRefs.current[index],
    );
    const futureCardElements = futureTimelineEvents.map(
      (_, index) => futureCardRefs.current[index],
    );

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
      !frameLeftElement ||
      !parisTextElement ||
      !parisCardElement ||
      !guangzhouTextElement ||
      !guangzhouCardElement ||
      !hongKongTextElement ||
      !hongKongCardElement ||
      futureTextElements.some((element) => !element) ||
      futureCardElements.some((element) => !element)
    ) {
      return;
    }

    const setLayerProgress = (scroll: number) => {
      const relativeScroll = scroll - scene.offsetTop;
      const travelDistance = window.innerHeight * 0.5;
      const zoomDistance = window.innerHeight * 0.18;
      const fadeDistance = window.innerHeight * 0.45;
      const frameDistance = window.innerHeight * 0.45;
      const frameShiftDistance = window.innerHeight * 4.5;
      const guangzhouTransitionDistance = window.innerHeight * 3.2;
      const hongKongTransitionDistance = window.innerHeight * 2.4;
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
      const frameStartScroll = travelDistance + zoomDistance + fadeDistance;
      const frameProgress = clamp(
        (relativeScroll - frameStartScroll) / frameDistance,
        0,
        1,
      );
      const frameShiftProgress = clamp(
        (relativeScroll - frameStartScroll - frameDistance) / frameShiftDistance,
        0,
        1,
      );
      const parisProgress = frameShiftProgress;
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
      const textStartScroll =
        frameStartScroll + frameDistance + frameShiftDistance + window.innerHeight * 0.05;
      const textProgress = clamp(
        (relativeScroll - textStartScroll) / (window.innerHeight * 0.16),
        0,
        1,
      );
      const cardStartScroll = textStartScroll + window.innerHeight * 0.3;
      const cardProgress = clamp(
        (relativeScroll - cardStartScroll) / (window.innerHeight * 0.24),
        0,
        1,
      );
      const guangzhouStartScroll =
        cardStartScroll + window.innerHeight * 0.24 + window.innerHeight * 0.08;
      const guangzhouProgress = clamp(
        (relativeScroll - guangzhouStartScroll) / guangzhouTransitionDistance,
        0,
        1,
      );
      const hongKongStartScroll =
        guangzhouStartScroll +
        guangzhouTransitionDistance +
        window.innerHeight * 0.25;
      const hongKongProgress = clamp(
        (relativeScroll - hongKongStartScroll) / hongKongTransitionDistance,
        0,
        1,
      );
      let futureTimelineCursor =
        hongKongStartScroll +
        hongKongTransitionDistance +
        window.innerHeight * 0.25;
      const futureProgresses = futureTimelineEvents.map((event) => {
        const eventTransitionDistance = window.innerHeight * event.transitionVh;
        const eventProgress = clamp(
          (relativeScroll - futureTimelineCursor) / eventTransitionDistance,
          0,
          1,
        );

        futureTimelineCursor +=
          eventTransitionDistance + window.innerHeight * 0.28;

        return eventProgress;
      });
      const futureEasedProgresses = futureProgresses.map(easeInOut);
      let activeFutureIndex = -1;

      futureProgresses.forEach((eventProgress, index) => {
        if (eventProgress > 0) {
          activeFutureIndex = index;
        }
      });

      const guangzhouEasedProgress = easeInOut(guangzhouProgress);
      const hongKongEasedProgress = easeInOut(hongKongProgress);
      const visibleMapWindow =
        activeFutureIndex >= 0
          ? interpolateMapWindow(
              activeFutureIndex === 0
                ? hongKongMapWindow
                : futureTimelineEvents[activeFutureIndex - 1].mapWindow,
              futureTimelineEvents[activeFutureIndex].mapWindow,
              futureEasedProgresses[activeFutureIndex],
            )
          : hongKongProgress > 0
          ? interpolateMapWindow(
              guangzhouMapWindow,
              hongKongMapWindow,
              hongKongEasedProgress,
            )
          : guangzhouProgress > 0
          ? interpolateMapWindow(
              parisMapWindow,
              guangzhouMapWindow,
              guangzhouEasedProgress,
            )
          : interpolateMapWindow(fullMapWindow, parisMapWindow, frameShiftProgress);
      const frameMapWindow =
        activeFutureIndex >= 0
          ? visibleMapWindow
          : hongKongProgress > 0
          ? visibleMapWindow
          : guangzhouProgress > 0
          ? visibleMapWindow
          : interpolateMapWindow(
              initialFrameWindow,
              parisMapWindow,
              frameShiftProgress,
            );
      const mapWindowBottom =
        100 - frameMapWindow.top - frameMapWindow.height;
      const mapWindowRight =
        100 - frameMapWindow.left - frameMapWindow.width;
      const parisTextOpacity = textProgress * (1 - guangzhouEasedProgress);
      const parisCardOpacity = cardProgress * (1 - guangzhouEasedProgress);
      const guangzhouTextProgress = easeInOut(
        clamp((guangzhouProgress - 0.72) / 0.12, 0, 1),
      );
      const guangzhouCardProgress = easeInOut(
        clamp((guangzhouProgress - 0.8) / 0.14, 0, 1),
      );
      const guangzhouTextOpacity =
        guangzhouTextProgress * (1 - hongKongEasedProgress);
      const guangzhouCardOpacity =
        guangzhouCardProgress * (1 - hongKongEasedProgress);
      const hongKongTextProgress = easeInOut(
        clamp((hongKongProgress - 0.72) / 0.12, 0, 1),
      );
      const hongKongCardProgress = easeInOut(
        clamp((hongKongProgress - 0.8) / 0.14, 0, 1),
      );
      const firstFutureEasedProgress = futureEasedProgresses[0] ?? 0;
      const hongKongTextOpacity =
        hongKongTextProgress * (1 - firstFutureEasedProgress);
      const hongKongCardOpacity =
        hongKongCardProgress * (1 - firstFutureEasedProgress);
      const backgroundRollProgress = Math.max(
        hongKongEasedProgress,
        ...futureEasedProgresses,
      );
      const backgroundRollY = lerp(0, 8, backgroundRollProgress);
      const backgroundPosition = `center calc(50% + ${backgroundRollY}vh)`;

      artworkElement.style.opacity = (1 - mapFade * 0.24).toString();
      artworkElement.style.transform = `scale(${artworkScale})`;
      scene.style.backgroundPosition = backgroundPosition;
      mapElement.style.transform = `translate3d(${mapX}vw, ${mapY}vh, 0) scale(${mapScale})`;
      booksElement.style.transform = `translate3d(${booksX}vw, ${booksY}vh, 0) scale(${booksScale})`;
      flagElement.style.transform = `translate3d(${flagX}vw, ${flagY}vh, 0) scale(${flagScale})`;
      pathElement.style.transform = `translate3d(0, ${pathY}vh, 0)`;
      transitionMapElement.style.opacity = mapFade.toString();
      transitionMapElement.style.clipPath = mapWindowToClipPath(visibleMapWindow);
      frameTopElement.style.opacity = frameProgress.toString();
      frameRightElement.style.opacity = frameProgress.toString();
      frameBottomElement.style.opacity = frameProgress.toString();
      frameLeftElement.style.opacity = frameProgress.toString();
      frameTopElement.style.height = `${frameMapWindow.top}vh`;
      frameRightElement.style.top = `${frameMapWindow.top}vh`;
      frameRightElement.style.bottom = `${mapWindowBottom}vh`;
      frameRightElement.style.width = `${mapWindowRight}vw`;
      frameBottomElement.style.height = `${mapWindowBottom}vh`;
      frameLeftElement.style.top = `${frameMapWindow.top}vh`;
      frameLeftElement.style.bottom = `${mapWindowBottom}vh`;
      frameLeftElement.style.width = `${frameMapWindow.left}vw`;
      const sideTextureTop = `-${frameMapWindow.top}vh`;
      const topTexture = frameTopElement.firstElementChild;
      const rightTexture = frameRightElement.firstElementChild;
      const bottomTexture = frameBottomElement.firstElementChild;
      const leftTexture = frameLeftElement.firstElementChild;

      if (topTexture instanceof HTMLElement) {
        topTexture.style.backgroundPosition = backgroundPosition;
      }

      if (rightTexture instanceof HTMLElement) {
        rightTexture.style.top = sideTextureTop;
        rightTexture.style.backgroundPosition = backgroundPosition;
      }

      if (bottomTexture instanceof HTMLElement) {
        bottomTexture.style.backgroundPosition = backgroundPosition;
      }

      if (leftTexture instanceof HTMLElement) {
        leftTexture.style.top = sideTextureTop;
        leftTexture.style.backgroundPosition = backgroundPosition;
      }

      parisTextElement.style.opacity = parisTextOpacity.toString();
      parisTextElement.style.transform = `translate3d(0, ${lerp(
        10,
        0,
        textProgress,
      ) + lerp(0, -8, guangzhouEasedProgress)}px, 0)`;
      parisCardElement.style.opacity = parisCardOpacity.toString();
      parisCardElement.style.transform = `translate3d(${lerp(
        18,
        0,
        cardProgress,
      ) + lerp(0, 22, guangzhouEasedProgress)}px, ${
        lerp(8, 0, cardProgress) + lerp(0, 12, guangzhouEasedProgress)
      }px, 0)`;
      guangzhouTextElement.style.opacity = guangzhouTextOpacity.toString();
      guangzhouTextElement.style.transform = `translate3d(0, ${lerp(
        12,
        0,
        guangzhouTextProgress,
      ) + lerp(0, -10, hongKongEasedProgress)}px, 0)`;
      guangzhouCardElement.style.opacity = guangzhouCardOpacity.toString();
      guangzhouCardElement.style.transform = `translate3d(${lerp(
        -18,
        0,
        guangzhouCardProgress,
      ) + lerp(0, -18, hongKongEasedProgress)}px, ${
        lerp(10, 0, guangzhouCardProgress) + lerp(0, -10, hongKongEasedProgress)
      }px, 0)`;
      hongKongTextElement.style.opacity = hongKongTextOpacity.toString();
      hongKongTextElement.style.transform = `translate3d(0, ${lerp(
        12,
        0,
        hongKongTextProgress,
      ) + lerp(0, -10, firstFutureEasedProgress)}px, 0)`;
      hongKongCardElement.style.opacity = hongKongCardOpacity.toString();
      hongKongCardElement.style.transform = `translate3d(${lerp(
        -18,
        0,
        hongKongCardProgress,
      ) + lerp(0, -18, firstFutureEasedProgress)}px, ${
        lerp(10, 0, hongKongCardProgress) + lerp(0, -10, firstFutureEasedProgress)
      }px, 0)`;
      futureTimelineEvents.forEach((_, index) => {
        const textElement = futureTextElements[index];
        const cardElement = futureCardElements[index];
        const eventProgress = futureProgresses[index];
        const eventTextProgress = easeInOut(
          clamp((eventProgress - 0.72) / 0.12, 0, 1),
        );
        const eventCardProgress = easeInOut(
          clamp((eventProgress - 0.8) / 0.14, 0, 1),
        );
        const nextEventEasedProgress = futureEasedProgresses[index + 1] ?? 0;

        if (textElement) {
          textElement.style.opacity = (
            eventTextProgress *
            (1 - nextEventEasedProgress)
          ).toString();
          textElement.style.transform = `translate3d(0, ${
            lerp(12, 0, eventTextProgress) +
            lerp(0, -10, nextEventEasedProgress)
          }px, 0)`;
        }

        if (cardElement) {
          cardElement.style.opacity = (
            eventCardProgress *
            (1 - nextEventEasedProgress)
          ).toString();
          cardElement.style.transform = `translate3d(${
            lerp(-18, 0, eventCardProgress) +
            lerp(0, -18, nextEventEasedProgress)
          }px, ${
            lerp(10, 0, eventCardProgress) +
            lerp(0, -10, nextEventEasedProgress)
          }px, 0)`;
        }
      });

      window.dispatchEvent(
        new CustomEvent("homepage-map-paris-progress", {
          detail: {
            parisProgress,
            guangzhouProgress,
            hongKongProgress,
            timelineProgresses: [
              parisProgress,
              guangzhouProgress,
              hongKongProgress,
              ...futureProgresses,
            ],
          },
        }),
      );

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
      className="relative h-[5600vh] bg-cover bg-center bg-no-repeat"
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
              sizes="80vw"
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
              sizes="80vw"
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
          className="pointer-events-none absolute inset-0 z-10 opacity-0 will-change-[clip-path,opacity,transform]"
          inert={true}
          style={{
            clipPath: "inset(0 0 0 0)",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <NorthMapScene className="h-full w-full" clipToVietnam enableParisScroll />
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          <div
            ref={frameTopRef}
            className="absolute left-0 right-0 top-0 h-[15vh] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[height,opacity,transform]"
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
            className="absolute bottom-[10vh] right-0 top-[15vh] w-[24vw] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[bottom,opacity,top,transform,width]"
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
            className="absolute bottom-0 left-0 right-0 h-[10vh] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[height,opacity,transform]"
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
            className="absolute bottom-[10vh] left-0 top-[15vh] w-[26vw] overflow-hidden bg-[#e8ddbf] opacity-0 will-change-[bottom,opacity,top,transform,width]"
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

        <div
          ref={parisTextRef}
          className="pointer-events-none absolute left-[10vw] top-[64vh] z-30 opacity-0 text-[#2f251a] will-change-[opacity,transform]"
          style={{ transform: "translate3d(0, 10px, 0)" }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a342b]">
            Pari
          </p>
          <p className="mt-1 text-3xl font-semibold leading-none">1920</p>
        </div>

        <section
          ref={parisCardRef}
          className="pointer-events-none absolute right-[clamp(1rem,7vw,6rem)] top-[19vh] z-30 w-[min(35rem,calc(100vw-2rem))] overflow-hidden border-y border-[#8a5c2f]/35 bg-[#f4e8c7]/78 px-7 py-6 text-[#2e261b] opacity-0 shadow-[0_16px_42px_rgb(50_35_18_/_0.14)] backdrop-blur-[1.5px] will-change-[opacity,transform]"
          style={{ transform: "translate3d(18px, 8px, 0)" }}
        >
          <Image
            src="/images/museum-ornament-overlay.png"
            alt=""
            fill
            priority
            sizes="35rem"
            className="object-cover opacity-35 mix-blend-multiply"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-[#fbf2da]/80" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#6f4d2e]/22" />

          <div className="relative flex items-start gap-5">
            <p className="pt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a342b]">
              01
            </p>

            <div>
              <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a33]">
                <span>Pari</span>
                <span className="h-px w-8 bg-[#8a342b]/40" />
                <span>Tháng 7, 1920</span>
              </div>

              <h2 className="max-w-[20ch] text-[clamp(1.55rem,2.05vw,2.4rem)] font-semibold leading-[1.08] text-[#2b1d11]">
                Nguyễn Ái Quốc tiếp cận Luận cương của Lênin
              </h2>

              <p className="mt-4 max-w-[42ch] text-[clamp(0.86rem,0.98vw,1rem)] leading-7 text-[#4a3c2c]">
                Từ Paris, một bước ngoặt tư tưởng mở ra con đường giải phóng
                dân tộc theo khuynh hướng cách mạng vô sản.
              </p>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a342b]">
                48.8566°N · 2.3522°E
              </p>
            </div>
          </div>
        </section>

        <div
          ref={guangzhouTextRef}
          className="pointer-events-none absolute left-[58vw] top-[55vh] z-30 opacity-0 text-[#2f251a] will-change-[opacity,transform]"
          style={{ transform: "translate3d(0, 12px, 0)" }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a342b]">
            Quảng Châu
          </p>
          <p className="mt-1 text-3xl font-semibold leading-none">1925</p>
        </div>

        <section
          ref={guangzhouCardRef}
          className="pointer-events-none absolute left-[clamp(1rem,7vw,6rem)] top-[18vh] z-30 w-[min(35rem,calc(100vw-2rem))] overflow-hidden border-y border-[#8a5c2f]/35 bg-[#f4e8c7]/78 px-7 py-6 text-[#2e261b] opacity-0 shadow-[0_16px_42px_rgb(50_35_18_/_0.14)] backdrop-blur-[1.5px] will-change-[opacity,transform]"
          style={{ transform: "translate3d(-18px, 10px, 0)" }}
        >
          <Image
            src="/images/museum-ornament-overlay.png"
            alt=""
            fill
            priority
            sizes="35rem"
            className="object-cover opacity-35 mix-blend-multiply"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-[#fbf2da]/80" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#6f4d2e]/22" />

          <div className="relative flex items-start gap-5">
            <p className="pt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a342b]">
              02
            </p>

            <div>
              <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a33]">
                <span>Quảng Châu</span>
                <span className="h-px w-8 bg-[#8a342b]/40" />
                <span>Tháng 6, 1925</span>
              </div>

              <h2 className="max-w-[20ch] text-[clamp(1.55rem,2.05vw,2.4rem)] font-semibold leading-[1.08] text-[#2b1d11]">
                Thành lập Hội Việt Nam Cách mạng Thanh niên
              </h2>

              <p className="mt-4 max-w-[42ch] text-[clamp(0.86rem,0.98vw,1rem)] leading-7 text-[#4a3c2c]">
                Từ Quảng Châu, Nguyễn Ái Quốc mở các lớp huấn luyện, truyền bá
                chủ nghĩa Mác-Lênin và chuẩn bị đội ngũ cán bộ cho phong trào
                cách mạng trong nước.
              </p>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a342b]">
                23.1291°N · 113.2644°E
              </p>
            </div>
          </div>
        </section>

        <div
          ref={hongKongTextRef}
          className="pointer-events-none absolute left-[60vw] top-[76vh] z-30 opacity-0 text-[#2f251a] will-change-[opacity,transform]"
          style={{ transform: "translate3d(0, 12px, 0)" }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a342b]">
            Hương Cảng
          </p>
          <p className="mt-1 text-3xl font-semibold leading-none">1930</p>
        </div>

        <section
          ref={hongKongCardRef}
          className="pointer-events-none absolute left-[clamp(1rem,7vw,6rem)] top-[18vh] z-30 w-[min(35rem,calc(100vw-2rem))] overflow-hidden border-y border-[#8a5c2f]/35 bg-[#f4e8c7]/78 px-7 py-6 text-[#2e261b] opacity-0 shadow-[0_16px_42px_rgb(50_35_18_/_0.14)] backdrop-blur-[1.5px] will-change-[opacity,transform]"
          style={{ transform: "translate3d(-18px, 10px, 0)" }}
        >
          <Image
            src="/images/museum-ornament-overlay.png"
            alt=""
            fill
            priority
            sizes="35rem"
            className="object-cover opacity-35 mix-blend-multiply"
          />
          <div className="absolute inset-x-0 top-0 h-px bg-[#fbf2da]/80" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#6f4d2e]/22" />

          <div className="relative flex items-start gap-5">
            <p className="pt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a342b]">
              03
            </p>

            <div>
              <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a33]">
                <span>Hương Cảng</span>
                <span className="h-px w-8 bg-[#8a342b]/40" />
                <span>Đầu năm 1930</span>
              </div>

              <h2 className="max-w-[20ch] text-[clamp(1.55rem,2.05vw,2.4rem)] font-semibold leading-[1.08] text-[#2b1d11]">
                Thành lập Đảng Cộng sản Việt Nam
              </h2>

              <p className="mt-4 max-w-[42ch] text-[clamp(0.86rem,0.98vw,1rem)] leading-7 text-[#4a3c2c]">
                Tại Hương Cảng, Nguyễn Ái Quốc chủ trì hội nghị hợp nhất các tổ
                chức cộng sản, thống nhất đường lối và tổ chức cho phong trào
                cách mạng Việt Nam.
              </p>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a342b]">
                22.3193°N · 114.1694°E
              </p>
            </div>
          </div>
        </section>

        {futureTimelineEvents.map((event, index) => (
          <div key={`${event.number}-caption`}>
            <div
              ref={(element) => {
                futureTextRefs.current[index] = element;
              }}
              className="pointer-events-none absolute z-30 opacity-0 text-[#2f251a] will-change-[opacity,transform]"
              style={{
                left: `${event.mapWindow.left}vw`,
                top: `${event.mapWindow.top + event.mapWindow.height + 1.5}vh`,
                transform: "translate3d(0, 12px, 0)",
              }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8a342b]">
                {event.label}
              </p>
              <p className="mt-1 text-3xl font-semibold leading-none">
                {event.year}
              </p>
            </div>

            <section
              ref={(element) => {
                futureCardRefs.current[index] = element;
              }}
              className="pointer-events-none absolute left-[clamp(1rem,7vw,6rem)] top-[18vh] z-30 w-[min(35rem,calc(100vw-2rem))] overflow-hidden border-y border-[#8a5c2f]/35 bg-[#f4e8c7]/78 px-7 py-6 text-[#2e261b] opacity-0 shadow-[0_16px_42px_rgb(50_35_18_/_0.14)] backdrop-blur-[1.5px] will-change-[opacity,transform]"
              style={{ transform: "translate3d(-18px, 10px, 0)" }}
            >
              <Image
                src="/images/museum-ornament-overlay.png"
                alt=""
                fill
                priority
                sizes="35rem"
                className="object-cover opacity-35 mix-blend-multiply"
              />
              <div className="absolute inset-x-0 top-0 h-px bg-[#fbf2da]/80" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-[#6f4d2e]/22" />

              <div className="relative flex items-start gap-5">
                <p className="pt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#8a342b]">
                  {event.number}
                </p>

                <div>
                  <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a5a33]">
                    <span>{event.label}</span>
                    <span className="h-px w-8 bg-[#8a342b]/40" />
                    <span>{event.meta.replace(`${event.label} · `, "")}</span>
                  </div>

                  <h2 className="max-w-[20ch] text-[clamp(1.55rem,2.05vw,2.4rem)] font-semibold leading-[1.08] text-[#2b1d11]">
                    {event.title}
                  </h2>

                  <p className="mt-4 max-w-[42ch] text-[clamp(0.86rem,0.98vw,1rem)] leading-7 text-[#4a3c2c]">
                    {event.description}
                  </p>

                  <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a342b]">
                    {event.coordinates}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ))}
      </div>
    </main>
  );
}
