import { training, experiences, companyLogos } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";



const ExperienceSection = () => (
  <SectionBlock id="experience" title="Experience">
    <div data-scan-group="experience" className="space-y-10">
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
  <div className="space-y-5">
    {items.map((exp, index) => (
      <div
        key={`${exp.role}-${exp.company}`}
        data-tone={index % 5}
        data-experience-item
        data-scan-item="experience"
        className="experience-item relative pb-4 last:pb-0"
      >
        <p data-scan-detail className="experience-date font-mono text-xs tracking-wider text-foreground/50 uppercase mb-2">
          {exp.period}
        </p>
        <div className="experience-brand">
          <div className="company-logo" data-construction="asset">
            {companyLogos[exp.company]
              ? <img src={`${import.meta.env.BASE_URL}${companyLogos[exp.company].image}`} alt={`${exp.company} logo`} loading="lazy" decoding="async" width="24" height="24" />
              : <span className="font-mono text-xs" aria-label={exp.company}>{exp.company.slice(0, 2)}</span>}
          </div>

          <h3 className="experience-company font-bold">{exp.company}</h3>
        </div>

        <div data-scan-detail className="experience-detail">
          <h3 className="experience-role text-base font-medium text-foreground/70 mb-3">
            {exp.role}
          </h3>
          {exp.description && <p className="body-text text-sm md:text-base">{exp.description}</p>}
        </div>
      </div>
    ))}
  </div>
);

export default ExperienceSection;
