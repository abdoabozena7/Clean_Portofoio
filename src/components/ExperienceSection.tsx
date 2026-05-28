import SectionBlock from "./SectionBlock";

const training = [
  {
    role: "AI & Data Science Training Program",
    company: "Instant Software Solutions",
    period: "Jan 2026 - Present",
    description:
      "Training across data science, machine learning, NLP, Transformers, LLM automation, and backend AI systems.",
  },
  {
    role: "AI / Machine Learning Track",
    company: "Digital Egypt Pioneers Initiative (DEPI)",
    period: "Nov 2025 - Present",
    description:
      "Applied track covering ML, deep learning, NLP, computer vision, MLOps concepts, and project-based assignments.",
  },
  {
    role: "AI & Data Science Course - Japanese Online Program",
    company: "GCI",
    period: "Present",
    description:
      "Currently studying AI and data science through a Japanese online program.",
  },
  {
    role: "Data Science Training Course",
    company: "Orange",
    period: "Sep 2024",
    description:
      "Completed data science training in a professional telecom environment in Egypt.",
  },
];

const experiences = [
  {
    role: "Back End Developer",
    company: "EgenSolve",
    period: "Mar 2025 - Sep 2025",
    description:
      "Developed a centralized backend system to manage employee accounts and system issues, linking users directly with developers through backend workflows and APIs.",
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
    <div className="space-y-16">
      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-8 text-black/40">
          AI / Data Science Training
        </h3>
        <Timeline items={training} />
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-8 text-black/40">
          Professional Experience
        </h3>
        <Timeline items={experiences} />
      </div>
    </div>
  </SectionBlock>
);

type TimelineItem = {
  role: string;
  company: string;
  period: string;
  description: string;
};

const Timeline = ({ items }: { items: TimelineItem[] }) => (
  <div className="space-y-12">
    {items.map((exp) => (
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
);

export default ExperienceSection;
