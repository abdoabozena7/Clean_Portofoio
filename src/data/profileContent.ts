/** Single editable source. Only promote source-checked facts into display slots.
 * LinkedIn is never scraped or contacted at runtime. Existing display slots are
 * retained verbatim so the verified archive does not silently grow the page. */
export const profileSources = {
  linkedin: "https://www.linkedin.com/in/abdelrahman-abozena",
  suppliedProfile: "Owner-supplied LinkedIn export: Profile (14).pdf",
  github: "https://github.com/abdoabozena7",
  checkedOn: "2026-11-01",
} as const;

export const animatedRoles = [
  "AI & Data Science Engineer", "LLM Agents / RAG Builder",
  "Machine Learning Engineer", "Python / FastAPI Systems",
];

export type Project = {
  id: string; title: string; description: string; tags: string[];
  githubUrl: string; image?: string; imageAlt?: string; imageSource?: string;
  inProgress?: boolean; kind?: "skill"; source: string;
};

export const projects: Project[] = [
  {
    id: "hivo", title: "Hivo Studio",
    description: "Running out of coding credits? Build with local models and a coordinated agent team.",
    tags: ["TypeScript", "Rust", "LLM Agents", "Ollama"],
    githubUrl: "https://github.com/abdoabozena7/OrchCode_Studio_-Multi-Agent-Coding-System-",
    image: "images/projects/hivo.png",
    imageAlt: "Hivo Studio desktop workspace connected to a local project, with its coding prompt composer.",
    imageSource: "Owner-supplied Hivo Studio screenshot", inProgress: true,
    source: "Public README identifies Hivo Studio despite the legacy repository slug; owner confirms ongoing work.",
  },
  {
    id: "ya-rab-ostorha", title: "YA RAB OSTORHA",
    description: "What happens before a crash? Explore collision-avoidance decisions in a CARLA driving simulation.",
    tags: ["Python", "CARLA", "Simulation"],
    githubUrl: "https://github.com/abdoabozena7/ya_rab_ostorha",
    image: "images/projects/ya-rab-ostorha.png",
    imageAlt: "YA RAB OSTORHA driving simulator with a CARLA street scene, vehicle telemetry, and sensor status.",
    imageSource: "Owner-supplied CARLA dashboard screenshot", inProgress: true,
    source: "Public README: collision-avoidance prototype. Full-route and physical acceptance remain incomplete.",
  },
  {
    id: "wazzefni", title: "Wazzefni",
    description: "Still juggling job tabs and CV edits? Turn your next career move into one guided workflow.",
    tags: ["LangGraph", "FastAPI", "React"],
    githubUrl: "https://github.com/renadborham123/lang-chain",
    image: "images/projects/wazzefni.png",
    imageAlt: "Wazzefni sign-in screen introducing its qualification plan, skill evidence, and CV workflow.",
    imageSource: "Real local frontend capture, signed-out state; no sample results or credentials",
    source: "Public README and local Git remote identify Wazzefni in renadborham123/lang-chain; owner supplied project attribution.",
  },
  {
    id: "community-simulator", title: "AgenticAI Community Simulator",
    description: "Got an idea and a budget to protect? Let AI personas debate it before you commit.",
    tags: ["Python", "FastAPI", "WebSockets"],
    githubUrl: "https://github.com/abdoabozena7/AgenticAI_Community_simulator",
    image: "images/projects/community-simulator.png",
    imageAlt: "Point of Return social simulation with a network graph, agent reasoning, and live metrics.",
    imageSource: "Owner-supplied Point of Return simulation screenshot",
    source: "Public repository description and README: simulated opinion evolution around user-defined ideas, not a prediction of market demand.",
  },
  {
    id: "prompt-optimizer", title: "Prompt Optimizer",
    description: "Your coding agent missed the point? Turn intent and code evidence into a sharper repair prompt.",
    tags: ["Python", "FastAPI", "React"],
    githubUrl: "https://github.com/abdoabozena7/Prompt_optimizer_for_coding_agents",
    image: "images/projects/prompt-optimizer.png",
    imageAlt: "Prompt Optimizer project setup for recovering intent and preparing a coding-agent repair plan.",
    imageSource: "Project's existing docs/assets/prompt-optimizer-home.png",
    source: "Current local README describes FastAPI and React; public repository description retains the earlier Streamlit stack.",
  },
  {
    id: "tayara", title: "Tayara Three.js",
    description: "Need a break from the terminal? Take a low-poly flight through a world built with Three.js.",
    tags: ["Three.js", "JavaScript", "3D"],
    githubUrl: "https://github.com/abdoabozena7/Tayara-ThreeJS",
    image: "images/projects/tayara.png",
    imageAlt: "Tayara gameplay above low-poly green islands and turquoise water, with coin and ring objectives.",
    imageSource: "https://github.com/abdoabozena7/Tayara-ThreeJS/blob/main/Screenshots/1.png",
    source: "Public README and original repository gameplay screenshot.",
  },
  {
    id: "harrtest", title: "HarrTest",
    description: "Your agent says ‘tested’ but never ran the app? Make it show the evidence.",
    tags: ["Agent Skill", "Verification", "Open Source"],
    githubUrl: "https://github.com/abdoabozena7/HarrTest", kind: "skill",
    source: "Public HarrTest README and SKILL.md: plan, build, run, observe, verify. A skill does not guarantee correctness or host enforcement.",
  },
];

// The existing display content stays verbatim. The fuller verified records below
// are available for deliberate future edits without adding new page sections.
export const education = [
  { degree: "B.S. in Computer Science - AI-focused specialization/coursework", school: "Egyptian Chinese University", year: "Undergraduate Program" },
  { degree: "Google x Kaggle - AI Agents Intensive Certification", school: "Google x Kaggle", year: "Certification" },
  { degree: "AI Summer School - Generative AI & Probabilistic Models", school: "Harbin Institute of Technology", year: "On-site in China" },
];

export const training = [
  { role: "AI & Data Science Training Program", company: "Instant Software Solutions", period: "Jan 2026 - Present", description: "Training across data science, machine learning, NLP, Transformers, LLM automation, and backend AI systems." },
  { role: "AI / Machine Learning Track", company: "Digital Egypt Pioneers Initiative (DEPI)", period: "Nov 2025 - Present", description: "Applied track covering ML, deep learning, NLP, computer vision, MLOps concepts, and project-based assignments." },
  { role: "AI & Data Science Course - Japanese Online Program", company: "GCI", period: "Present", description: "Currently studying AI and data science through a Japanese online program." },
  { role: "Data Science Training Course", company: "Orange", period: "Sep 2024", description: "Completed data science training in a professional telecom environment in Egypt." },
];

export const experiences = [
  { role: "Back End Developer", company: "EgenSolve", period: "Mar 2025 - Sep 2025", description: "Developed a centralized backend system to manage employee accounts and system issues, linking users directly with developers through backend workflows and APIs." },
  { role: "React Developer", company: "Crossover", period: "Oct 2022 - Dec 2023", description: "Delivered high-performance front-end solutions in a remote, product-oriented development environment." },
];

export const repositoryStats = {
  total: 92, public: 63, private: 29,
  totalSource: "Owner-reported total, 1 November 2026",
  publicSource: "https://api.github.com/users/abdoabozena7",
  privateSource: "Derived: owner-reported 92 total minus 63 public; no private account access",
  checkedOn: profileSources.checkedOn,
};

export const profileContent = {
  name: "Abdelrahman Abozena",
  headline: "SWE Intern at Microsoft",
  currentRole: { title: "SWE Intern", company: "Microsoft", source: profileSources.suppliedProfile },
  linkedinUrl: profileSources.linkedin,
  githubUrl: profileSources.github,
  email: "boodyabozena@gmail.com",
  avatar: "images/portrait-cutout.png",
  animatedRoles,
  repositoryStats,
  repositories: repositoryStats,
  projects, education, training, experiences,
  verifiedExperience: [
    { company: "Microsoft", role: "SWE Intern", period: "October 2026 - Present", location: "Cairo, Egypt", description: null },
    { company: "Instant Software Solutions", role: "AI & Data science Engineer", period: "January 2026 - Present", location: "Giza, Al Jizah, Egypt", description: null },
    { company: "Foursw", role: "Artificial Intelligence Engineer", period: "June 2026 - October 2026", location: "Giza", description: "Design and implement AI solutions for software projects; integrate LLMs, AI agents, and intelligent workflows into existing systems." },
    { company: "FlyRank AI", role: "Backend AI Engineering Internship", period: "May 2026 - August 2026", location: "Giza", description: "AI internship focusing on Backend AI Engineering." },
    { company: "Orange", role: "Intern", period: "July 2026", location: "Qesm El Doki", description: "Built AI agent workflows using Flowise and n8n, with RAG, vector databases, memory management, and external tools and data sources." },
    { company: "Digital Egypt Pioneers Initiative - DEPI", role: "Machine Learning Engineer", period: "November 2025 - July 2026", location: "Egypt", description: null },
    { company: "EgenSolve", role: "Back End Developer", period: "March 2025 - April 2025", location: "Giza, Al Jizah, Egypt", description: "Developed a system to manage employee accounts and handle system issues, linking them directly with developers for faster problem resolution." },
    { company: "Crossover", role: "React Developer", period: "October 2022 - December 2023", location: null, description: null },
  ],
  verifiedEducation: [
    { institution: "Egyptian Chinese University", subject: "Computer Science", period: null },
    { institution: "Harbin Institute of Technology", subject: "Artificial Intelligence", period: null },
  ],
  verifiedCertifications: [
    { title: "GCI World April 2026", credentialUrl: null },
    { title: "Google × Kaggle – AI Agents Intensive", credentialUrl: null },
    { title: "AI Summer School (Generative AI & Probabilistic Models) – HIT", credentialUrl: null },
  ],
  verifiedRecordSource: profileSources.suppliedProfile,
  verifiedAchievements: [] as { title: string; date: string | null; sourceUrl: string }[],
  // Add only owner-confirmed or publicly sourced updates. Drafts do not render.
  recentUpdates: [] as { title: string; date: string; sourceUrl: string }[],
  nextUpdate: { title: null, date: null, sourceUrl: null },
};
