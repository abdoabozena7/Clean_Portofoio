import type { EducationItem } from "@/data/profileContent";
import ResponsiveThumbnail from "./ResponsiveThumbnail";
import { Trophy, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import "@/styles/exploration-evidence.css";

type CredentialListProps = {
  items: EducationItem[];
  group: "education" | "honors";
};

/** Real copy and media stay mounted for the scroll-adaptive scan presentation. */
const CredentialList = ({ items, group }: CredentialListProps) => (
  <div className="credential-list" data-scan-group={group}>
    {items.map((item, index) => (
      <div
        key={`${item.degree}-${item.school}`}
        data-certificate
        data-tone={index % 5}
        data-scan-item="credential"
        data-attention-id={item.achievement ? "honors-impact" : item.school === "Harbin Institute of Technology" ? "education-harbin" : item.degree === "Microsoft Machine Learning Engineer" ? "honors-depi" : undefined}
        data-attention-critical={item.achievement || item.school === "Harbin Institute of Technology" || item.degree === "Microsoft Machine Learning Engineer" || undefined}
        data-achievement={item.achievement || undefined}
        className="credential credential-evidence border-l-2 pl-4 sm:pl-6"
      >
        <div className="credential-copy">
          {item.achievement && <span data-scan-detail className="achievement-ribbon" data-construction="asset"><Trophy className="w-3.5 h-3.5" aria-hidden="true" /> 1st place</span>}
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{item.degree}</h3>
          <div className="flex flex-col gap-1 mt-2" data-scan-detail>
            <span className="text-sm text-foreground font-medium">{item.school}</span>
            <span className="font-mono text-xs text-foreground/60">{item.year}</span>
          </div>
        </div>
        {item.image && (
          <Dialog>
            <DialogTrigger asChild>
              <button data-construction="asset" data-scan-detail className="certificate-image-trigger" aria-label={`Zoom in ${item.degree} ${item.achievement ? "photo" : "certificate"}`}>
                <ResponsiveThumbnail
                  path={item.image}
                  sizes="(min-width: 640px) calc(100vw - 86px), calc(100vw - 78px)"
                  alt={item.imageAlt}
                  className="certificate-thumb"
                  width={item.imageWidth}
                  height={item.imageHeight}
                  style={{ aspectRatio: `${item.imageWidth} / ${item.imageHeight}` }}
                />
                <span className="certificate-zoom" aria-hidden="true"><ZoomIn className="w-4 h-4" /></span>
              </button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{item.degree}</DialogTitle>
                <DialogDescription>{item.school} · {item.year}</DialogDescription>
              </DialogHeader>
              <img src={`${import.meta.env.BASE_URL}${item.image}`} alt={item.imageAlt} className="w-full max-h-[70dvh] object-contain" />
            </DialogContent>
          </Dialog>
        )}
        <div className="credential-description">
          <p className="text-sm leading-relaxed text-foreground/70" data-scan-detail>{item.brief}</p>
          {item.storyUrl && <a href={item.storyUrl} target="_blank" rel="noopener noreferrer" data-scan-detail className="credential-story inline-block font-mono text-xs font-bold mt-3 underline underline-offset-4">The winning idea</a>}
        </div>
      </div>
    ))}
  </div>
);

export default CredentialList;
