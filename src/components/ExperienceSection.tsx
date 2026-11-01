import { training, experiences, companyLogos } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";



const ExperienceSection = () => (
  <SectionBlock id="experience" title="Experience">
    <div className="space-y-16">
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-8 text-black/40">
          Professional Experience
        </h3>
        <Timeline items={experiences} />
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-8 text-black/40">
          Internships & Applied Training
        </h3>
        <Timeline items={training} />
      </div>
    </div>
  </SectionBlock>
);

type TimelineItem = {
  role: string;
  company: string;
  period: string;
  description: string | null;
};

const Timeline = ({ items }: { items: TimelineItem[] }) => (
  <div className="space-y-12">
    {items.map((exp, index) => (
      <div
        key={`${exp.role}-${exp.company}`}
        data-tone={index % 5}
        className="relative pl-8 md:pl-0 border-l md:border-l-0 border-black/20 md:grid md:grid-cols-[1fr_2fr] md:gap-8 pb-12 last:pb-0"
      >
        <div className="md:text-right md:pr-8 md:border-r border-black/20 relative">
          <div className="company-logo" data-construction="asset">
            {companyLogos[exp.company]
              ? <img src={`${import.meta.env.BASE_URL}${companyLogos[exp.company].image}`} alt={`${exp.company} logo`} loading="lazy" decoding="async" width="24" height="24" />
              : <span className="font-mono text-xs" aria-label={exp.company}>{exp.company.slice(0, 2)}</span>}
          </div>

          <h4 className="font-mono text-sm tracking-widest text-foreground/60 uppercase mb-1">
            {exp.period}
          </h4>
          <h3 className="font-bold text-lg md:text-xl">{exp.company}</h3>
        </div>

        <div className="mt-2 md:mt-0">
          <h3 className="text-lg font-bold text-foreground md:hidden mb-2">
            {exp.role}
          </h3>
          <h3 className="text-xl font-bold text-foreground hidden md:block mb-3">
            {exp.role}
          </h3>
          {exp.description && <p className="body-text text-sm md:text-base">{exp.description}</p>}
        </div>
      </div>
    ))}
  </div>
);

export default ExperienceSection;
