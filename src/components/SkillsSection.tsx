import { skillCategories } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import GithubGraph from "./GithubGraph";

const SkillsSection = () => (
  <SectionBlock id="skills" title="Technical Skills">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
      {skillCategories.map((category, idx) => (
        <div
          key={category.title}
          className="skill-category group opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards"
          data-tone={idx % 5}
          style={{
            animationDelay: `${idx * 100}ms`,
            animationDuration: "600ms",
            animationFillMode: "forwards",
          }}
        >
          <div className="flex flex-col h-full border-t-2 border-black pt-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] mb-6 text-black/40 group-hover:text-black transition-colors duration-300">
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => (
                <span
                  key={skill}
                  data-tone={(idx + skillIndex) % 5}
                  className="palette-tag px-3 py-1.5 border border-black/5 text-xs font-medium transition-all duration-300 cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="w-full pt-12 border-t border-black/5">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-black/40">
            GitHub Activity
          </h3>
          <div className="h-[1px] flex-1 bg-black/5 mx-6"></div>
        </div>
        <GithubGraph />
      </div>
    </div>
  </SectionBlock>
);

export default SkillsSection;
