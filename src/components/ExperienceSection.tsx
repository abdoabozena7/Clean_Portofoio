import { training, experiences, companyLogos } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import CompanyEvidence from "./CompanyEvidence";



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
};

const Timeline = ({ items }: { items: TimelineItem[] }) => (
  <div className="space-y-5">
    {items.map((exp, index) => (
      <div
        key={`${exp.role}-${exp.company}`}
        data-tone={index % 5}
        data-experience-item
        data-attention-id={exp.company === "Microsoft" ? "experience-microsoft" : undefined}
        data-attention-critical={exp.company === "Microsoft" || undefined}
        data-scan-item="experience"
        className="experience-item relative pb-4 last:pb-0"
      >
        <div className="experience-brand">
          <div className="company-logo" data-construction="asset">
            {companyLogos[exp.company]
              ? <img src={`${import.meta.env.BASE_URL}${companyLogos[exp.company].image}`} alt={`${exp.company} logo`} loading="lazy" decoding="async" width="24" height="24" />
              : <span className="font-mono text-xs" aria-label={exp.company}>{exp.company.slice(0, 2)}</span>}
            <CompanyEvidence variant={index} />
          </div>

          <div className="experience-copy">
            <h3 className="experience-company font-bold">{exp.company}</h3>
            <h4 className="experience-role font-medium text-foreground/70">{exp.role}</h4>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ExperienceSection;
