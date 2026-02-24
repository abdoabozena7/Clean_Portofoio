import SectionBlock from "./SectionBlock";
import { Globe } from "lucide-react";
import AnimatedAvatar from "./AnimatedAvatar";

const AboutSection = () => (
  <SectionBlock id="about" title="About me">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
      <AnimatedAvatar />

      <div className="flex-1">
        <p className="body-text max-w-2xl">
          I am an AI-driven software engineer focused on building production-ready
          systems with large language models, machine learning pipelines, and
          scalable backend APIs.
        </p>
        <p className="body-text max-w-2xl mt-6">
          My work bridges AI concepts with practical software delivery using
          Node.js, Python, TypeScript, and data-driven architectures across web
          and backend environments.
        </p>
        <p className="body-text max-w-2xl mt-6 mb-8">
          I care about reliability, maintainability, and measurable impact,
          turning experimental ideas into end-to-end AI products that solve
          real-world business problems.
        </p>
        <a
          href="https://abdoabozena7.github.io/Instafolio"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 px-6 py-3 border-2 border-black bg-white text-black text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white"
        >
          <Globe className="w-4 h-4" />
          <span>View Portfolio Profile</span>
        </a>
      </div>
    </div>
  </SectionBlock>
);

export default AboutSection;
