import { profileContent } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import { Globe } from "lucide-react";
import AnimatedAvatar from "./AnimatedAvatar";

const AboutSection = () => (
  <SectionBlock id="about" title="About me">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
      <AnimatedAvatar />

      <div className="flex-1">
        <p className="body-text max-w-2xl">
          {profileContent.about[0]}
        </p>
        <p className="body-text max-w-2xl mt-6">
          {profileContent.about[1]}
        </p>
        <p className="body-text max-w-2xl mt-6 mb-8">
          {profileContent.about[2]}
        </p>
        <a
          href="https://abdoabozena7.github.io/Clean_Portofoio/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 px-6 py-3 border-2 border-black bg-white text-black text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-black hover:text-white"
        >
          <Globe className="w-4 h-4" />
          <span>View Showcase Profile</span>
        </a>
      </div>
    </div>
  </SectionBlock>
);

export default AboutSection;
