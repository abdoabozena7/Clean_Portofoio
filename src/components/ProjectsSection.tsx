import { Github, ExternalLink } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { Badge } from "./ui/badge";

type Project = {
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
};

const projects: Project[] = [
  {
    title: "OrchCode Studio - Multi-Agent Coding System",
    description:
      "Local-first multi-agent coding environment that turns ideas into code through orchestration, planning, controlled execution, memory/context handling, and provider-agnostic LLM workflows.",
    tags: ["TypeScript", "Rust", "LLM Agents", "Local LLMs"],
  },
  {
    title: "AgenticAI Community Simulator",
    description:
      "Full-stack multi-agent simulation platform where AI personas discuss, object, support, influence each other, and model social opinion evolution around user-defined ideas.",
    tags: ["Python", "FastAPI", "React", "WebSockets", "MySQL"],
    githubUrl: "https://github.com/abdoabozena7/AgenticAI_Community_simulator",
  },
  {
    title: "AdClick Prediction System / Project Fusion ECU",
    description:
      "Leakage-safe, time-aware CTR prediction pipeline using fused user profiles, ad metadata, and behavior data with cleaning, EDA, feature engineering, XGBoost, evaluation, and a Streamlit decision console.",
    tags: ["Python", "Jupyter", "Data Fusion", "XGBoost", "Streamlit"],
    githubUrl: "https://github.com/abdoabozena7/AdClick-Prediction-System",
  },
  {
    title: "Real-Time Comment Analysis & Fake Comment Detection Pipeline",
    description:
      "End-to-end analytics pipeline for comment sentiment, suspicious/coordinated behavior detection, alerts, and live monitoring with local LLM integration.",
    tags: ["FastAPI", "Kafka", "Ollama", "SQLite", "React/Vite"],
  },
  {
    title: "Ask Your PDF with Transformers",
    description:
      "Document QA app where users upload PDF/TXT files, ask questions across the full document or selected sections, and inspect supporting context and annotations.",
    tags: ["FastAPI", "Transformers", "PyTorch", "PyPDF2", "Tailwind UI"],
    githubUrl: "https://github.com/abdoabozena7/Ask_your_pdf_with_transformers",
  },
  {
    title: "Prompt Optimizer for Coding Agents",
    description:
      "Streamlit tool that analyzes code diffs and user intent, asks clarifying questions, and generates precise final prompts for AI coding agents.",
    tags: ["Python", "Streamlit", "LLM Prompting", "Coding Agents"],
    githubUrl:
      "https://github.com/abdoabozena7/Prompt_optimizer_for_coding_agents",
  },
  {
    title: "Robot Vision / Real-Time Object Detection",
    description:
      "AI vision project for real-time object detection in robot point-of-view videos, enabling perception, tracking, and scene understanding.",
    tags: ["Python", "Computer Vision", "Object Detection", "Video Analytics"],
    githubUrl: "https://github.com/abdoabozena7/robot-vision-dart",
  },
  {
    title: "Agentic Router Attack Simulation",
    description:
      "Simulation of router manipulation and task tampering in agentic AI systems, showing how insecure tool routing can lead to sensitive data leakage.",
    tags: ["Agentic AI Safety", "Simulation", "Prompt Tampering"],
    githubUrl:
      "https://github.com/abdoabozena7/agentic-router-attack-simulation",
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

          {project.githubUrl && (
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
          )}
        </div>
      ))}
    </div>
  </SectionBlock>
);

export default ProjectsSection;
