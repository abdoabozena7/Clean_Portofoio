import SectionBlock from "./SectionBlock";

const experiences = [
  {
    role: "AI & Data Science Engineer",
    company: "Instant Software Solutions",
    period: "Jan 2026 - Present",
    description:
      "Engineering AI-driven solutions and integrating LLM-powered automation into backend systems in Giza, Egypt.",
  },
  {
    role: "Machine Learning Engineer",
    company: "Digital Egypt Pioneers Initiative (DEPI)",
    period: "Nov 2025 - Present",
    description:
      "Developing machine learning pipelines and implementing predictive models for real-world applications.",
  },
  {
    role: "Back End Developer",
    company: "EgenSolve",
    period: "Mar 2025 - Sep 2025",
    description:
      "Built a centralized system for employee account management and issue resolution, linking users directly with developers.",
  },
  {
    role: "Trainee",
    company: "Orange",
    period: "Sep 2024",
    description:
      "Completed industry training focused on software engineering practices and telecom workflows.",
  },
  {
    role: "React Developer",
    company: "Crossover",
    period: "Oct 2022 - Dec 2023",
    description:
      "Delivered high-performance front-end solutions in a remote, product-oriented development environment.",
  },
];

const ExperienceSection = () => (
  <SectionBlock id="experience" title="Experience">
    <div className="space-y-12">
      {experiences.map((exp) => (
        <div
          key={`${exp.role}-${exp.company}`}
          className="relative pl-8 md:pl-0 border-l md:border-l-0 border-black/20 md:grid md:grid-cols-[1fr_2fr] md:gap-8 pb-12 last:pb-0"
        >
          <div className="md:text-right md:pr-8 md:border-r border-black/20 relative">
            <div className="hidden md:block absolute top-1 -right-[5px] w-[9px] h-[9px] rounded-full bg-black"></div>
            <div className="md:hidden absolute top-1 -left-[5px] w-[9px] h-[9px] rounded-full bg-black"></div>

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
            <p className="body-text text-sm md:text-base">{exp.description}</p>
          </div>
        </div>
      ))}
    </div>
  </SectionBlock>
);

export default ExperienceSection;