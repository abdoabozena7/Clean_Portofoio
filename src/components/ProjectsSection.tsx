import { Github, ExternalLink } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { Badge } from "./ui/badge";

type Project = {
  title: string;
  description: string;
  tags: string[];
  githubUrl: string;
};

const projects: Project[] = [
  {
    title: "HIT-Ai_project",
    description:
      "GestureLogger - real-time body language and gesture analyzer built with MediaPipe and Google Gemini.",
    tags: ["Python", "MediaPipe", "Gemini"],
    githubUrl: "https://github.com/abdoabozena7/HIT-Ai_project",
  },
  {
    title: "AgenticAI_Community_simulator-DEPI",
    description:
      "A multi-agent AI ecosystem that simulates social opinion evolution and emergent group behaviors for user-defined ideas.",
    tags: ["TypeScript", "Multi-Agent Systems", "LLM Agents"],
    githubUrl:
      "https://github.com/abdoabozena7/AgenticAI_Community_simulator-DEPI",
  },
  {
    title: "Malware_Detection_AI_Cyber-security",
    description:
      "Cyber-security malware detection project using static analysis, signature checks, heuristic rules, and a Streamlit interface.",
    tags: ["Python", "Cyber Security", "Streamlit"],
    githubUrl:
      "https://github.com/abdoabozena7/Malware_Detection_AI_Cyber-security",
  },
  {
    title: "project_fusion_ecu",
    description:
      "Leakage-safe, time-aware CTR prediction pipeline using fused multi-source data with feature selection and XGBoost.",
    tags: ["Jupyter Notebook", "Machine Learning", "XGBoost"],
    githubUrl: "https://github.com/abdoabozena7/project_fusion_ecu",
  },
  {
    title: "clinic-app-nodeJS",
    description:
      "Role-based medical appointment system with admin, doctor, and patient dashboards plus scheduling and reminders.",
    tags: ["JavaScript", "Node.js", "Role-Based Access"],
    githubUrl: "https://github.com/abdoabozena7/clinic-app-nodeJS",
  },
  {
    title: "Tayara-ThreeJS",
    description:
      "Low-poly 3D flight game where players collect coins and pass through rings to complete level objectives.",
    tags: ["JavaScript", "Three.js", "Game Development"],
    githubUrl: "https://github.com/abdoabozena7/Tayara-ThreeJS",
  },
];

const ProjectsSection = () => (
  <SectionBlock id="projects" title="Projects">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.title}
          className="group relative border-2 border-black p-5 flex flex-col justify-between hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 bg-white"
        >
          <div>
            <h3 className="text-xl font-black text-foreground group-hover:underline decoration-4 underline-offset-4 break-words">
              {project.title}
            </h3>
            <p className="body-text mt-4 text-sm font-normal">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {project.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="font-mono text-[10px] font-bold border border-black/10 px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-black/10">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white"
            >
              <Github className="w-3.5 h-3.5" />
              Source
            </a>
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-black bg-white text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Repo
            </a>
          </div>
        </div>
      ))}
    </div>
  </SectionBlock>
);

export default ProjectsSection;