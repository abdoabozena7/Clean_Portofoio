import { Github, Image as ImageIcon } from "lucide-react";
import { projects } from "@/data/profileContent";
import { useRef } from "react";
import { useProjectFootprint } from "@/hooks/useProjectFootprint";
import SectionBlock from "./SectionBlock";
import HarrTestFlow from "./HarrTestFlow";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import "@/styles/projects.css";

const actionClass = "flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

const ProjectsSection = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  useProjectFootprint(gridRef, projects.length);
  return (
  <SectionBlock id="projects" title="Projects">
    <div ref={gridRef} className="project-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          data-project={project.id}
          data-construction="structure"
          className="project-card group relative border-2 border-black p-5 flex flex-col justify-between hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 bg-white"
        >
          {project.inProgress && (
            <span className="project-building" title="Currently working on this project">
              <span aria-hidden="true" /> Building
            </span>
          )}
          <div className="project-copy">
            <h3 data-construction="text" className="text-xl font-black text-foreground group-hover:underline decoration-4 underline-offset-4 break-words">
              {project.title}
            </h3>
            <p data-construction="text" className="body-text mt-4 text-sm font-normal">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-mono text-[10px] font-bold border border-black/10 px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {project.image ? (
            <Dialog>
              <div className="project-media" data-construction="asset">
                <DialogTrigger asChild>
                  <button className="project-image-trigger" aria-label={`Enlarge ${project.title} screenshot`}>
                    <img src={`${import.meta.env.BASE_URL}${project.image}`} alt={project.imageAlt} loading="lazy" decoding="async" width="1920" height="1080" />
                  </button>
                </DialogTrigger>
              </div>
              <div className="project-actions flex gap-3 border-t border-black/10">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={actionClass} aria-label={`${project.title} source on GitHub`}>
                  <Github className="w-3.5 h-3.5" /> Source
                </a>
                <DialogTrigger asChild>
                  <button className={actionClass} aria-label={`Preview ${project.title}`}>
                    <ImageIcon className="w-3.5 h-3.5" /> Preview
                  </button>
                </DialogTrigger>
              </div>
              <DialogContent className="project-preview-dialog">
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
              <div className="project-actions flex gap-3 border-t border-black/10">
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
