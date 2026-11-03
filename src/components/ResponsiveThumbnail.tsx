import { useState, type ImgHTMLAttributes } from "react";

const variants: Readonly<Record<string, readonly number[]>> = {
  "images/projects/community-simulator.png": [360, 720, 1080, 1917],
  "images/projects/hivo.png": [360, 720, 1080, 1920],
  "images/projects/prompt-optimizer.png": [360, 720, 1080, 1917],
  "images/projects/tayara.png": [360, 720, 1080, 1920],
  "images/projects/wazzefni.png": [360, 720, 1080, 1440],
  "images/projects/ya-rab-ostorha.png": [360, 720, 1080, 1920],
  "images/certificates/depi-2026.png": [360, 720, 1080, 1122],
  "images/certificates/gci-world-2026.jpg": [360, 720, 1077],
  "images/certificates/hit-summer-school-2025.jpg": [360, 489],
  "images/certificates/impact-first-place-2026.png": [360, 720, 1080, 1280],
  "images/certificates/learning-csharp-2026.png": [360, 720, 1031],
  "images/certificates/orange-ai-2024.png": [360, 720, 1001],
  "images/portrait-cutout.png": [240, 480, 720, 1345],
};

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
  path: string;
  sizes: string;
};

export default function ResponsiveThumbnail({ path, sizes, onError, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<string>();
  const widths = variants[path];
  const source = import.meta.env.BASE_URL + path;
  const stem = source.replace(/\.[^.]+$/, "");
  const webp = widths && failedSource !== path
    ? widths.map(width => `${stem}-${width}.webp ${width}w`).join(", ")
    : undefined;

  return (
    <picture style={{ display: "contents" }}>
      {webp && <source media="(max-width: 767px)" type="image/webp" srcSet={webp} sizes={sizes} />}
      <img
        src={source}
        loading="lazy"
        decoding="async"
        {...props}
        onError={event => {
          const image = event.currentTarget;
          if (webp && image.currentSrc && image.currentSrc !== image.src) {
            setFailedSource(path);
          } else {
            onError?.(event);
          }
        }}
      />
    </picture>
  );
}
