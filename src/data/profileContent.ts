/** Single editable source for all displayed professional content.
 * LinkedIn is never scraped or contacted at runtime. Profile facts come from the
 * owner-supplied PDF and certificates; repository facts retain their sources. */
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
    id: "harrtest", title: "HarrTest",
    description: "Your agent says ‘tested’ but never ran the app? Make it show the evidence.",
    tags: ["Agent Skill", "Verification", "Open Source"],
    githubUrl: "https://github.com/abdoabozena7/HarrTest", kind: "skill", inProgress: true,
    source: "Public HarrTest README and SKILL.md: plan, build, run, observe, verify. A skill does not guarantee correctness or host enforcement.",
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
    imageAlt: "Prompt Optimizer review screen showing recovered intent, selected commits, blind spots, and clarification questions.",
    imageSource: "Owner-supplied cleaner Prompt Optimizer review screenshot, 1 November 2026",
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

];

export type EducationItem = {
  degree: string; school: string; year: string; image?: string;
  imageAlt?: string; source: string; duration?: string; imageWidth?: number; imageHeight?: number;
  brief: string; achievement?: boolean; storyUrl?: string;
};

export const education: EducationItem[] = [
  {
    degree: "Computer Science", school: "Egyptian Chinese University",
    year: "Undergraduate Program", source: profileSources.suppliedProfile,
    brief: "Studying Computer Science at Egyptian Chinese University.",
  },
  {
    degree: "Artificial Intelligence, Leading the Frontier - International Summer School",
    school: "Harbin Institute of Technology", year: "July 7-18, 2025 · Completed",
    image: "images/certificates/hit-summer-school-2025.jpg",
    imageWidth: 489, imageHeight: 695,
    imageAlt: "Harbin Institute of Technology completion certificate for the Artificial Intelligence international summer school, July 7-18, 2025.",
    source: "Owner-supplied HIT completion certificate",
    brief: "Completed the international summer school exploring the frontiers of artificial intelligence.",
  },
];

/** Awards and completed professional learning; achievements lead the list. */
export const honors: EducationItem[] = [
  {
    degree: "IMPACT Hackathon — 1st Place", school: "GDG on Campus · Egyptian Chinese University",
    year: "2026 · Hivo Studio", achievement: true,
    brief: "Won first place with Hivo Studio, an AI coding workspace that plans and coordinates complex development tasks.",
    image: "images/certificates/impact-first-place-2026.png", imageWidth: 1280, imageHeight: 853,
    imageAlt: "Abdelrahman and teammate celebrating first place at IMPACT with the First Winner award.",
    source: "Owner-supplied winning photo and publicly accessible LinkedIn IMPACT post",
    storyUrl: "https://lnkd.in/p/eDP9zBzM",
  },
  {
    degree: "AI Agents Intensive", school: "Google × Kaggle",
    year: "Certification", source: profileSources.suppliedProfile,
    brief: "Completed the AI Agents Intensive program from Google and Kaggle.",
  },
  {
    degree: "GCI World April 2026 - Data Science",
    school: "Matsuo-Iwasawa Laboratory, The University of Tokyo",
    year: "Completed · Certificate issued August 31, 2026",
    image: "images/certificates/gci-world-2026.jpg",
    imageWidth: 1077, imageHeight: 774,
    imageAlt: "GCI World April 2026 completion certificate issued by the Matsuo-Iwasawa Laboratory, University of Tokyo, on August 31, 2026, confirming the final assessment was passed.",
    source: "Owner-supplied GCI completion certificate",
    brief: "Completed data science theory and implementation coursework and passed the final assessment.",
  },
  {
    degree: "Learning C#", school: "LinkedIn Learning",
    year: "Completed October 29, 2026 · 2h 54m", duration: "2 hours 54 minutes",
    image: "images/certificates/learning-csharp-2026.png",
    imageWidth: 1031, imageHeight: 795,
    imageAlt: "LinkedIn Learning Learning C# course completion certificate for Abdelrahman Abozena, October 29, 2026, duration 2 hours 54 minutes.",
    source: "Owner-supplied LinkedIn Learning completion certificate",
    brief: "Completed 2 hours 54 minutes of C# learning with LinkedIn Learning.",
  },
  {
    degree: "Microsoft Machine Learning Engineer", school: "Digital Egypt Pioneers Initiative · MCIT",
    year: "November 2025 – July 2026 · Completed",
    brief: "Completed the Microsoft Machine Learning Engineer training track through DEPI.",
    image: "images/certificates/depi-2026.png", imageWidth: 1122, imageHeight: 610,
    imageAlt: "DEPI certificate of achievement for the Microsoft Machine Learning Engineer track, November 2025 to July 2026, sponsored by Egypt's Ministry of Communications and Information Technology.",
    source: "Owner-supplied DEPI certificate of achievement, November 2, 2026",
  },
  {
    degree: "Artificial Intelligence Level 1", school: "Orange Digital Center",
    year: "September 14–23, 2024 · 24 hours · Grade 99%",
    brief: "Built AI foundations in data preparation, feature learning, machine learning, and training and testing.",
    image: "images/certificates/orange-ai-2024.png", imageWidth: 1001, imageHeight: 563,
    imageAlt: "Orange Digital Center Artificial Intelligence Level 1 completion certificate, 24-hour course in September 2024, grade 99 percent.",
    source: "Owner-supplied Orange Digital Center certificate, November 2, 2026",
  },
];

export type ExperienceItem = {
  company: string; role: string; period: string; description: string | null;
  location: string | null; source?: string;
};

/** Local copies from public company pages; no LinkedIn request is made by the portfolio. */
export const companyLogos: Record<string, { image: string; source: string }> = {
  Microsoft: { image: "images/microsoft-symbol.svg", source: "https://www.microsoft.com/" },
  "Instant Software Solutions": { image: "images/companies/instant.jpg", source: "https://www.linkedin.com/company/instantsoftwaresolution" },
  Foursw: { image: "images/companies/foursw.jpg", source: "https://www.linkedin.com/company/foursoftware" },
  EgenSolve: { image: "images/companies/egensolve.jpg", source: "https://www.linkedin.com/company/egensolve" },
  Crossover: { image: "images/companies/crossover.jpg", source: "https://www.linkedin.com/company/crossover" },
  "FlyRank AI": { image: "images/companies/flyrank.jpg", source: "https://www.linkedin.com/company/flyrank" },
  Orange: { image: "images/companies/orange.jpg", source: "https://www.linkedin.com/company/orange" },
  "Digital Egypt Pioneers Initiative - DEPI": { image: "images/companies/depi.png", source: "https://depi.gov.eg/assets/images/proAr.png" },
};

export const experiences: ExperienceItem[] = [
  { company: "Microsoft", role: "SWE Intern", period: "October 2026 - Present", location: "Cairo, Egypt", description: "Software engineering internship at Microsoft." },
  { company: "Instant Software Solutions", role: "AI & Data Science Engineer", period: "January 2026 - Present", location: "Giza, Al Jizah, Egypt", description: null },
  { company: "Foursw", role: "Artificial Intelligence Engineer", period: "June 2026 - October 2026", location: "Giza", description: "Design and implement AI solutions for software projects. Integrate LLMs, AI agents, and intelligent workflows into existing systems, turning business requirements into practical AI features." },
  { company: "EgenSolve", role: "Back End Developer", period: "March 2025 - April 2025", location: "Giza, Al Jizah, Egypt", description: "Developed a system to manage employee accounts and handle system issues, linking them directly with developers for faster problem resolution." },
  { company: "Crossover", role: "React Developer · Part-time freelance", period: "October 2022 - December 2023", location: null, description: "Contributed to React development on a part-time freelance basis through Crossover.", source: "Owner clarification, November 1, 2026: freelance engagement, not direct employment" },
];

export const training: ExperienceItem[] = [
  { company: "FlyRank AI", role: "Backend AI Engineering Internship", period: "May 2026 - August 2026", location: "Giza", description: "AI internship focusing on Backend AI Engineering." },
  { company: "Orange", role: "Intern", period: "July 2026", location: "Qesm El Doki", description: "Built AI agent workflows using Flowise and n8n, with RAG, vector databases, memory management, and external tools and data sources." },
  { company: "Digital Egypt Pioneers Initiative - DEPI", role: "Machine Learning Engineer", period: "November 2025 - July 2026", location: "Egypt", description: null },
];

export const skillCategories = [
  {
    title: "AI & ML",
    skills: [
      "Generative AI",
      "LLM Agents",
      "RAG",
      "LangGraph",
      "Prompt Engineering",
      "Deterministic LLM Programming",
      "Multi-Agent Systems",
      "Local LLMs/Ollama",
      "Transformers",
      "NLP",
      "Machine Learning",
      "Deep Learning",
      "MLOps",
    ],
  },
  {
    title: "Data Science",
    skills: [
      "EDA",
      "Data Preprocessing",
      "Feature Engineering",
      "Model Evaluation",
      "CTR Prediction",
      "Sentiment Analysis",
      "Computer Vision/YOLO",
      "Data Fusion",
    ],
  },
  {
    title: "Backend & MLOps",
    skills: [
      "Python",
      "FastAPI",
      "Node.js",
      "Express",
      "RESTful APIs",
      "WebSockets",
      "Kafka",
      "Streamlit",
      "Real-Time Inference",
      "Backend System Architecture",
      "Flowise",
      "n8n",
    ],
  },
  {
    title: "Databases",
    skills: ["MySQL", "MongoDB", "SQLite"],
  },
  {
    title: "Languages & Tools",
    skills: [
      "Python",
      "JavaScript",
      "TypeScript",
      "C#",
      "Git",
      "GitHub",
      "Docker Basics",
    ],
  },
  {
    title: "Frontend",
    skills: ["React", "Vite", "Tailwind CSS"],
  },
  {
    title: "Certification",
    skills: [
      "Google x Kaggle - AI Agents Intensive",
      "AI Summer School - Harbin Institute of Technology",
      "GCI World April 2026 - Completed",
      "LinkedIn Learning - Learning C#",
    ],
  },
];

export const repositoryStats = {
  total: 92, public: 63, private: 29,
  totalSource: "Owner-reported total, 1 November 2026",
  publicSource: "https://api.github.com/users/abdoabozena7",
  privateSource: "Derived: owner-reported 92 total minus 63 public; no private account access",
  checkedOn: profileSources.checkedOn,
};

export const profileContent = {
  instagramUrl: "https://www.instagram.com/abdoabozena1/",
  name: "Abdelrahman Abozena",
  headline: "SWE Intern at Microsoft",
  microsoftStoryUrl: "https://lnkd.in/p/e-7HV-sM",
  currentRole: { title: "SWE Intern", company: "Microsoft", source: profileSources.suppliedProfile },
  linkedinUrl: profileSources.linkedin,
  githubUrl: profileSources.github,
  email: "boodyabozena@gmail.com",
  location: "Giza, Egypt",
  avatar: "images/portrait-cutout.png",
  avatarStatus: "AI Engineer",
  about: [
    "I’m Abdelrahman, an AI Engineer who started coding before university. I like logic, figuring things out, and asking why. Computers usually make sense. Usually.",
    "Curiosity took me from software through data, ML, and deep learning to LLMs. Today, I build practical RAG systems and AI agents with Python and FastAPI.",
    "I’m a fourth-year Computer Science student at Egyptian Chinese University, with one year remaining, and a SWE Intern at Microsoft. Still learning, building, and asking why.",
  ],
  contactIntro: "Currently a SWE Intern at Microsoft. For AI, backend, or open-source collaboration, feel free to reach out.",
  footerNote: "Based in Giza, Egypt | Let's talk AI, agents, and engineering",
  terminalBio: "I am Abdelrahman Abozena, a SWE Intern at Microsoft and an AI engineer building Agentic AI, RAG, and scalable Python/FastAPI systems.",
  terminalSkills: ["Agentic AI / LLM Agents / RAG", "Python / FastAPI / Backend Systems", "Machine Learning / MLOps", "C# - Learning C# completed"],
  marqueeTags: [
    "Abdelrahman Abozena", "SWE Intern at Microsoft",
    "Agentic AI | RAG | Python | FastAPI", "Building practical AI systems with evidence",
  ],
  animatedRoles,
  repositoryStats,
  repositories: repositoryStats,
  projects, education, honors, training, experiences, skillCategories,
  verifiedExperience: [...experiences, ...training],
  verifiedEducation: [
    { institution: "Egyptian Chinese University", subject: "Computer Science", period: null },
    { institution: "Harbin Institute of Technology", subject: "Artificial Intelligence", period: "July 7-18, 2025" },
  ],
  verifiedCertifications: [...education.slice(1), ...honors].filter(item => !item.achievement).map(item => ({ title: item.degree, credentialUrl: null, source: item.source })),
  verifiedRecordSource: profileSources.suppliedProfile,
  verifiedAchievements: [{ title: "IMPACT Hackathon 2026 — 1st Place with Hivo Studio", date: null, sourceUrl: "https://lnkd.in/p/eDP9zBzM" }],
  // Add only owner-confirmed or publicly sourced updates. Drafts do not render.
  recentUpdates: [] as { title: string; date: string; sourceUrl: string }[],
  nextUpdate: { title: null, date: null, sourceUrl: null },
};
