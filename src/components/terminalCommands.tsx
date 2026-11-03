import type { ReactNode } from "react";
import { profileContent, projects } from "@/data/profileContent";

const getCommandResponse = (cmd: string): ReactNode | null => {
  switch (cmd) {
    case "help":
      return (
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <span className="text-green-400">about</span>
          <span>Learn about me</span>
          <span className="text-green-400">skills</span>
          <span>View technical skills</span>
          <span className="text-green-400">projects</span>
          <span>List recent projects</span>
          <span className="text-green-400">contact</span>
          <span>How to reach me</span>
          <span className="text-green-400">clear</span>
          <span>Clear the terminal</span>
          <span className="text-green-400">exit</span>
          <span>Close terminal</span>
        </div>
      );
    case "about":
      return profileContent.terminalBio;
    case "skills":
      return (
        <div>
          <p className="mb-1">CORE STACK:</p>
          {profileContent.terminalSkills.map(skill => <p key={skill}>- {skill}</p>)}
        </div>
      );
    case "projects":
      return (
        <div className="flex flex-col gap-1">
          {projects.map((project, index) => <a key={project.id} href="#projects" className="text-blue-400 hover:underline">{index + 1}. {project.title}</a>)}
        </div>
      );
    case "contact":
      return (
        <div>
          <p>
            Email:{" "}
            <a
              href="mailto:boodyabozena@gmail.com"
              className="text-blue-400 hover:underline"
            >
              boodyabozena@gmail.com
            </a>
          </p>
          <p>
            LinkedIn:{" "}
            <a
              href={profileContent.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              linkedin.com/in/abdelrahman-abozena
            </a>
          </p>
          <p>
            GitHub:{" "}
            <a
              href="https://github.com/abdoabozena7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              github.com/abdoabozena7
            </a>
          </p>
        </div>
      );
    default:
      return null;
  }
};

const processQuery = (input: string): ReactNode | null => {
  const lower = input.toLowerCase();

  if (lower.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello. I can help you explore Abdelrahman's profile. Try: skills, projects, or contact.";
  }

  if (lower.match(/(who|about|author|creator|developer)/)) {
    return getCommandResponse("about");
  }

  if (lower.match(/(skill|stack|tech|language|framework)/)) {
    return getCommandResponse("skills");
  }

  if (lower.match(/(project|work|app|site|portfolio)/)) {
    return getCommandResponse("projects");
  }

  if (lower.match(/(contact|email|reach|hire|github|linkedin)/)) {
    return getCommandResponse("contact");
  }

  return null;
};

export function respondToCommand(command: string): ReactNode {
  return getCommandResponse(command.toLowerCase()) ?? processQuery(command) ?? (
    <span className="text-red-400">
      Command not understood. Try asking "who are you?", "show skills", or
      type 'help'.
    </span>
  );
}
