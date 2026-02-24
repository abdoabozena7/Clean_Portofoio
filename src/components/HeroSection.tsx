import { useState, useEffect, useRef } from "react";
import { Github, Linkedin, Mail, ChevronDown, Globe } from "lucide-react";

const roles = [
  "AI-Driven Software Engineer",
  "Machine Learning Engineer",
  "Backend Developer",
  "LLM Agent Builder",
];

const HeroSection = () => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const currentRole = roles[roleIndex];
    const typeSpeed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentRole.slice(0, displayText.length + 1));
        if (displayText.length === currentRole.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setDisplayText(currentRole.slice(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setRoleIndex((prev) => (prev + 1) % roles.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, roleIndex]);

  // Matrix-style rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01{}[]<>/*#=+-;:.abcdefghijklmnopqrstuvwxyz";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];

        // Lead character - brighter
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Trail character - slightly dimmer
        if (drops[i] > 1) {
          const trailChar = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
          ctx.fillText(trailChar, i * fontSize, (drops[i] - 1) * fontSize);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.97) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 60);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center items-center relative px-6 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <div className="absolute top-28 left-6 md:left-10 z-10 hidden md:block">
        <p className="font-mono text-xs text-foreground/60 leading-relaxed font-medium">
          // portfolio.tsx
          <br />
          // version: 3.0.0
          <br />
          // status: production
          <br />
          // last_build: {new Date().toISOString().split("T")[0]}
        </p>
      </div>

      <div className="absolute top-28 right-6 md:right-10 z-10 hidden md:block">
        <p className="font-mono text-xs text-foreground/40 leading-relaxed text-right font-medium">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="block">
              {String(i + 1).padStart(3, "0")}
            </span>
          ))}
        </p>
      </div>

      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-foreground/30 bg-background/80 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="font-mono text-xs text-foreground/90 tracking-[0.15em] uppercase font-medium">
            Open to opportunities
          </span>
        </div>

        <h1
          className="heading-brutal leading-[0.85]"
          style={{ fontSize: "clamp(48px, 10vw, 130px)" }}
        >
          Abdelrahman
          <br />
          <span className="text-foreground/20">Abozena.</span>
        </h1>

        <div className="mt-6 h-8 flex items-center justify-center">
          <span className="font-mono text-sm md:text-base tracking-[0.2em] text-foreground/50">
            {"< "}
          </span>
          <span className="font-mono text-sm md:text-base tracking-[0.15em] text-foreground/70 font-medium">
            {displayText}
          </span>
          <span
            className={`font-mono text-sm md:text-base text-foreground/70 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            |
          </span>
          <span className="font-mono text-sm md:text-base tracking-[0.2em] text-foreground/50">
            {" />"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-md mx-auto">
          {[
            "LLM Agents",
            "Machine Learning",
            "TypeScript",
            "Python",
            "Node.js",
            "MongoDB",
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 font-mono text-xs border-2 border-foreground/40 text-foreground/80 font-medium tracking-wider hover:bg-foreground hover:text-background transition-all duration-300 cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-10">
          {[
            {
              Icon: Github,
              href: "https://github.com/abdoabozena7",
              label: "GitHub",
            },
            {
              Icon: Linkedin,
              href: "https://www.linkedin.com/in/abdelrahman-abozena",
              label: "LinkedIn",
            },
            {
              Icon: Globe,
              href: "https://abdoabozena7.github.io/Instafolio",
              label: "Portfolio",
            },
            {
              Icon: Mail,
              href: "mailto:boodyabozena@gmail.com",
              label: "Email",
            },
          ].map(({ Icon, href, label }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="group relative inline-flex items-center justify-center p-3 border-2 border-black bg-white text-black transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] hover:bg-black hover:text-white"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        <div className="mt-10">
          <a
            href="/resume.pdf"
            download="Abdelrahman_Abozena_Resume.pdf"
            className="group relative inline-flex items-center gap-2 px-8 py-4 border-2 border-black bg-black text-white text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:bg-white hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>Download Resume</span>
            <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 -translate-y-[1px] group-hover:translate-y-[1px] transition-transform duration-300"></span>
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-6 md:left-10 z-10">
        <span className="text-foreground/80 text-xs tracking-[0.2em] uppercase font-mono font-medium">
          abdoabozena7.github.io/Instafolio
        </span>
      </div>

      <div className="absolute bottom-10 right-6 md:right-10 z-10 hidden md:block">
        <div className="font-mono text-xs text-foreground/80 text-right leading-relaxed font-medium">
          <p>const experience = "3+ years";</p>
          <p>const projects = 2;</p>
          <p>const focus = "LLM + Backend";</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <ChevronDown className="w-5 h-5 text-foreground/30 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
