import { Github, ZoomIn } from "lucide-react";
import { useRef } from "react";
import { requestDetailedView } from "@/lib/scrollIntent";
import { projects } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import ResponsiveThumbnail from "./ResponsiveThumbnail";
import HarrTestFlow from "./HarrTestFlow";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import "@/styles/projects.css";
import "@/styles/exploration-evidence.css";

const actionClass = "accent-button flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

const ProjectsSection = () => {
  const openers = useRef(new Map<string, HTMLButtonElement>());
  return (
  <SectionBlock id="projects" title="Projects">
    <div data-scan-group="projects" className="project-grid grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project, projectIndex) => (
        <div
          key={project.id}
          id={`project-${project.id}`}
          data-priority={project.inProgress || undefined}
          data-attention-critical={project.id === "hivo" || undefined}
          data-project={project.id}
          data-tone={(projectIndex + 2) % 5}
          data-construction="structure"
          className={`project-card ${project.kind === "skill" ? "project-card--skill" : ""} ${project.id === "hivo" ? "project-card--featured" : ""} group relative border-2 border-black p-5 flex flex-col hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 bg-white`}
        >
          {project.inProgress && (
            <span data-scan-detail className="project-building" title="Currently working on this project">
              <span aria-hidden="true" /> In progress
            </span>
          )}
          <div className="project-copy">
            <h3 data-construction="text" className="text-xl font-black text-foreground group-hover:underline decoration-4 underline-offset-4 break-words">
              {project.title}
            </h3>
            <p data-scan-detail data-construction="text" className="project-description body-text mt-4 text-sm font-normal">
              {project.description}
            </p>
            <div className="project-tags flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag, tagIndex) => (
                <Badge key={tag} data-tone={(projectIndex + tagIndex) % 5} variant="secondary" className="palette-tag font-mono text-[10px] font-bold border border-black/10 px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {project.image ? (
            <Dialog>
              <div className="project-media" data-construction="asset">
                <DialogTrigger asChild>
                  <button className="project-image-trigger" onClick={event => openers.current.set(project.id, event.currentTarget)} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} aria-label={`Zoom in on ${project.title} screenshot`}>
                    <ResponsiveThumbnail path={project.image} sizes="calc(100vw - 92px)" alt={project.imageAlt} width="1920" height="1080" />
                  </button>
                </DialogTrigger>
              </div>
              <div data-scan-detail className="project-actions flex gap-3 border-t border-black/10">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={actionClass} aria-label={`${project.title} source on GitHub`}>
                  <Github className="w-3.5 h-3.5" /> Source
                </a>
                <DialogTrigger asChild>
                  <button className={actionClass} onClick={event => openers.current.set(project.id, event.currentTarget)} aria-label={`Zoom in ${project.title}`}>
                    <ZoomIn className="w-3.5 h-3.5" /> Zoom in
                  </button>
                </DialogTrigger>
              </div>
              <DialogContent className="project-preview-dialog" onCloseAutoFocus={event => {
                event.preventDefault(); requestDetailedView();
                const opener = openers.current.get(project.id);
                opener?.focus({ preventScroll: true });
                const rect = opener?.getBoundingClientRect();
                if (rect && (rect.top < 76 || rect.bottom > innerHeight)) opener?.scrollIntoView({ behavior: "instant", block: "nearest" });
              }}>
                <DialogHeader>
                  <DialogTitle>{project.title}</DialogTitle>
                  <DialogDescription>{project.imageAlt}</DialogDescription>
                </DialogHeader>
                <img src={`${import.meta.env.BASE_URL}${project.image}`} alt={project.imageAlt} width="1920" height="1080" />
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <div className="project-media project-flow-media"><HarrTestFlow /></div>
              <div data-scan-detail className="project-actions flex gap-3 border-t border-black/10">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={actionClass} aria-label="Read the HarrTest skill on GitHub">
                  <Github className="w-3.5 h-3.5" /> Explore Skill
                </a>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  </SectionBlock>
  );
};

export default ProjectsSection;
