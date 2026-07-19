import Image from "next/image";

const heroLayers = [
  {
    src: "/images/layers/vietnam-map-ink-v4-right-overlay.png",
    className:
      "origin-left -translate-x-[35vw] translate-y-[18vh] scale-[1.9] opacity-58 mix-blend-multiply blur-[0.6px]",
  },
  {
    src: "/images/layers/history-light-particles-v2-overlay.png",
    className: "opacity-36 translate-y-[-30vw]",
  },
  {
    src: "/images/layers/golden-timeline-path-v6-generated-overlay.png",
    className: "opacity-95",
  },
  //sách
  {
    src: "/images/layers/archival-documents-collage-v2-overlay.png",
    className:
      "origin-bottom-left translate-x-[-2vw] translate-y-[3vh] scale-[0.78] opacity-90 mix-blend-multiply",
  },
  //cờ
  {
    src: "/images/layers/red-party-fabric-v2-overlay.png",
    className: "origin-bottom-left opacity-95 scale-[0.78] translate-y-[3vw] mix-blend-multiply",
  },
];

export default function Homepage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/vietnam-timeline-background.png')" }}
    >
      {heroLayers.map((layer) => (
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
    </main>
  );
}
