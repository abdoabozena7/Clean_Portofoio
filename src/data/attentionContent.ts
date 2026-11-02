/** Curated invitations; exposure evidence does not establish reading. */
export type AttentionItem = { id: string; selector: string; title: string; message: string; critical?: boolean };

export const attentionContent: AttentionItem[] = [
  { id: "experience-microsoft", selector: "[data-attention-id='experience-microsoft']", title: "Microsoft", message: "A Microsoft SWE internship deserves a second look.", critical: true },
  { id: "education-harbin", selector: "[data-attention-id='education-harbin']", title: "Harbin Institute of Technology", message: "The China chapter: AI summer school at Harbin.", critical: true },
  { id: "honors-impact", selector: "[data-attention-id='honors-impact']", title: "IMPACT · 1st place", message: "First place. 15,000 EGP. Meet the Hivo Studio win.", critical: true },
  { id: "honors-depi", selector: "[data-attention-id='honors-depi']", title: "DEPI · Microsoft ML Engineer", message: "Don't miss the Microsoft ML Engineer training track.", critical: true },
  { id: "project-hivo", selector: "#project-hivo", title: "Hivo Studio", message: "Coding credits running out? Meet my local-agent studio.", critical: true },
  { id: "project-harrtest", selector: "#project-harrtest", title: "HarrTest", message: "Your agent said “tested”? Ask it for the evidence." },
  { id: "project-wazzefni", selector: "#project-wazzefni", title: "Wazzefni", message: "Your next job search could use fewer tabs." },
  { id: "project-community-simulator", selector: "#project-community-simulator", title: "AgenticAI Community Simulator", message: "Test the idea before betting the budget." },
  { id: "skills-ai", selector: "[data-attention-id='skills-ai']", title: "AI & ML", message: "Plot twist: the AI skills have another chapter." },
  { id: "skills-data", selector: "[data-attention-id='skills-data']", title: "Data Science", message: "The data has a story. Fancy a closer look?" },
  { id: "skills-backend", selector: "[data-attention-id='skills-backend']", title: "Backend & MLOps", message: "There’s a backend behind this plot twist." },
];
