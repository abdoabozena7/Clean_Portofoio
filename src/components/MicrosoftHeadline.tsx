import { profileContent } from "@/data/profileContent";

/** Occupies the original badge's 34px height; width may grow without moving h1. */
export default function MicrosoftHeadline() {
  return (
    <div data-microsoft-headline data-construction="structure" className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-foreground/30 bg-background/80 backdrop-blur-md shadow-sm h-[34px] whitespace-nowrap">
      <img data-construction="asset" src={`${import.meta.env.BASE_URL}images/microsoft-symbol.svg`} width="14" height="14" alt="" className="w-3.5 h-3.5 shrink-0" />
      <span data-construction="text" className="font-mono text-xs text-foreground/90 tracking-[0.08em] font-medium">
        {profileContent.headline}
      </span>
    </div>
  );
}
