import { useState, useEffect, useRef } from "react";
import { Github, Linkedin, Mail, ChevronDown, Globe } from "lucide-react";
import MicrosoftHeadline from "./MicrosoftHeadline";
import HeroAgentsOverlay from "./HeroAgentsOverlay";
import { profileContent, animatedRoles as roles } from "@/data/profileContent";


const HeroSection = () => {
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Matrix-style rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "01{}[]<>/*#=+-;:.abcdefghijklmnopqrstuvwxyz";
    const fontSize = 14;
    const drops: number[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / fontSize);
      if (drops.length > columns) drops.length = columns;
      while (drops.length < columns) drops.push(1);
    };
    window.addEventListener("resize", resize);

    // Rasterize the original font and opacities once; copies land on the
    // same integer grid and baseline as the previous per-frame fillText.
    const atlas = document.createElement("canvas");
    const cell = 24, inset = 4, baseline = 17;
    atlas.width = chars.length * cell;
    atlas.height = cell * 2;
    const glyphs = atlas.getContext("2d");
    const font = `${fontSize}px monospace`;
    const inks = ["rgba(0, 0, 0, 0.15)", "rgba(0, 0, 0, 0.07)"];
    if (glyphs) {
      glyphs.font = font;
      inks.forEach((ink, row) => {
        glyphs.fillStyle = ink;
        for (let i = 0; i < chars.length; i++) glyphs.fillText(chars[i], i * cell + inset, row * cell + baseline);
      });
    }
    const glyph = (column: number, y: number, row: number) => {
      const i = Math.floor(Math.random() * chars.length), x = column * fontSize;
      if (glyphs) ctx.drawImage(atlas, i * cell, row * cell, cell, cell, x - inset, y - baseline, cell, cell);
      else {
        ctx.font = font;
        ctx.fillStyle = inks[row];
        ctx.fillText(chars[i], x, y);
      }
    };
    const draw = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        glyph(i, y, 0);
        if (drops[i] > 1) glyph(i, y - fontSize, 1);
        if (y > canvas.height && Math.random() > 0.97) drops[i] = 0;
        drops[i]++;
      }
    };

    let interval: ReturnType<typeof setInterval> | undefined;
    let visible = true;
    let sized = false;
    const update = () => {
      if (interval) clearInterval(interval);
      interval = sized && visible && !document.hidden ? setInterval(draw, 60) : undefined;
    };
    const initialSize = new ResizeObserver(() => {
      initialSize.disconnect();
      resize();
      sized = true;
      update();
    });
    initialSize.observe(canvas.parentElement ?? canvas);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      clearInterval(interval);
      initialSize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  return (
    <section id="hero" data-construction-section className="min-h-screen flex flex-col justify-center items-center relative px-6 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <div data-construction-skip className="absolute top-28 left-6 md:left-10 z-10 hidden md:block">
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

      <div data-construction-skip className="absolute top-28 right-6 md:right-10 z-10 hidden md:block">
        <p className="font-mono text-xs text-foreground/40 leading-relaxed text-right font-medium">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="block">
              {String(i + 1).padStart(3, "0")}
            </span>
          ))}
        </p>
      </div>

      <div className="text-center relative z-10">
        <MicrosoftHeadline />

        <h1
          ref={headingRef}
          data-construction="text" data-construction-scene="letters"
          className="heading-brutal leading-[0.85]"
          style={{ fontSize: "clamp(48px, 10vw, 130px)" }}
        >
          Abdelrahman
          <br />
          <span className="text-foreground/20">Abozena.</span>
        </h1>
        <HeroAgentsOverlay headingRef={headingRef} />

        <div data-construction="text" className="mt-6 h-8 flex items-center justify-center">
          <span className="font-mono text-sm md:text-base tracking-[0.2em] text-foreground/50">
            {"< "}
          </span>
          <span className="font-mono text-sm md:text-base tracking-[0.15em] text-foreground/70 font-medium">
            {roles[0]}
          </span>
          <span className="font-mono text-sm md:text-base tracking-[0.2em] text-foreground/50">
            {" />"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-md mx-auto">
          {[
            "RAG",
            "FastAPI",
            "Python",
            "Transformers",
            "Kafka",
            "Ollama",
          ].map((tech, index) => (
            <span
              key={tech}
              data-tone={index % 5}
              className="palette-tag px-3 py-1 font-mono text-xs border-2 border-foreground/40 text-foreground/80 font-medium tracking-wider transition-all duration-300 cursor-default"
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
              href: profileContent.linkedinUrl,
              label: "LinkedIn",
            },
            {
              Icon: Globe,
              href: "https://abdoabozena7.github.io/main/",
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
              data-tone={i % 5}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="accent-button group relative inline-flex items-center justify-center p-3 border-2 border-black bg-white text-black transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        <div className="mt-10">
          <a
            href={`${import.meta.env.BASE_URL}resume.pdf`}
            download="Abdelrahman_Abozena_CV.pdf"
            className="group relative inline-flex items-center gap-2 px-8 py-4 border-2 border-black bg-black text-white text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:bg-white hover:text-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <span>Download CV</span>
            <span className="w-2 h-2 border-r-2 border-b-2 border-current rotate-45 -translate-y-[1px] group-hover:translate-y-[1px] transition-transform duration-300"></span>
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-6 md:left-10 z-10">
        <span className="text-foreground/80 text-xs tracking-[0.2em] uppercase font-mono font-medium">
          abdoabozena7.github.io/main
        </span>
      </div>

      <div data-construction-skip className="absolute bottom-10 right-6 md:right-10 z-10 hidden md:block">
        <div className="font-mono text-xs text-foreground/80 text-right leading-relaxed font-medium">
          <p>const experience = "AI + Backend";</p>
          <p title={profileContent.repositoryStats.privateSource}>const repos = {profileContent.repositoryStats.total}; // {profileContent.repositoryStats.public} public / {profileContent.repositoryStats.private} private</p>
          <p>const focus = "LLM + RAG";</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <ChevronDown className="w-5 h-5 text-foreground/30 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
