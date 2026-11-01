import { education } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import { ArrowUpRight, Trophy, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";


const EducationSection = () => (
  <SectionBlock id="education" title="Education & Certifications">
    <div className="space-y-8">
      {education.map((item) => (
        <div
          key={`${item.degree}-${item.school}`}
          data-certificate data-achievement={item.achievement || undefined}
          className="credential border-l-2 border-black/10 pl-6 py-2 hover:border-black transition-colors duration-300"
        >
          <div className="credential-copy">
          {item.achievement && <span className="achievement-ribbon" data-construction="asset"><Trophy className="w-3.5 h-3.5" aria-hidden="true" /> 1st place</span>}
          <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
            {item.degree}
          </h3>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-sm text-foreground font-medium">{item.school}</span>
            <span className="font-mono text-xs text-foreground/60">
              {item.year}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/70 mt-3">{item.brief}</p>
          {item.storyUrl && <a href={item.storyUrl} target="_blank" rel="noopener noreferrer" className="credential-story inline-flex items-center gap-1 font-mono text-xs font-bold mt-3 underline underline-offset-4">The winning idea <ArrowUpRight className="w-3 h-3" aria-hidden="true" /></a>}
          </div>
          {item.image && (
            <Dialog>
              <DialogTrigger asChild>
                <button data-construction="asset" className="certificate-image-trigger transition-shadow" aria-label={`Zoom in ${item.degree} ${item.achievement ? "photo" : "certificate"}`}>
                  <img src={`${import.meta.env.BASE_URL}${item.image}`} alt={item.imageAlt} className="certificate-thumb" loading="lazy" decoding="async" width={item.imageWidth} height={item.imageHeight} />
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
        </div>
      ))}
    </div>
  </SectionBlock>
);

export default EducationSection;
