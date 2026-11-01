import { education } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";


const EducationSection = () => (
  <SectionBlock id="education" title="Education & Certifications">
    <div className="space-y-10">
      {education.map((item) => (
        <div
          key={`${item.degree}-${item.school}`}
          className="border-l-2 border-black/10 pl-6 py-2 hover:border-black transition-colors duration-300"
        >
          <h3 className="text-lg md:text-xl font-bold text-foreground">
            {item.degree}
          </h3>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-2">
            <span className="text-foreground font-medium">{item.school}</span>
            <span className="hidden md:inline text-foreground/20">|</span>
            <span className="font-mono text-sm text-foreground/60">
              {item.year}
            </span>
          </div>
          {item.image && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="certificate-image-trigger transition-shadow" aria-label={`Zoom in ${item.degree} certificate`}>
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
