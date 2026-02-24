import { Github, Linkedin, ArrowUp, Heart, Globe, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    { icon: Github, href: "https://github.com/abdoabozena7", label: "GitHub" },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/abdelrahman-abozena",
      label: "LinkedIn",
    },
    {
      icon: Globe,
      href: "https://abdoabozena7.github.io/Instafolio",
      label: "Portfolio",
    },
    {
      icon: Mail,
      href: "mailto:boodyabozena@gmail.com",
      label: "Email",
    },
  ];

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <footer className="w-full bg-white border-t-4 border-black pt-16 pb-32 px-6 md:pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">
              ABDELRAHMAN ABOZENA<span className="text-foreground">.....</span>
            </h2>
            <p className="text-foreground/60 max-w-sm leading-relaxed">
              AI-driven software engineer building machine learning systems,
              LLM-powered applications, and scalable backend services.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  aria-label={link.label}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-black/40">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-8">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-medium hover:underline underline-offset-4 decoration-2 transition-all"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6 flex flex-col items-start md:items-end">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-black/40">
              Back to start
            </h3>
            <button
              onClick={scrollToTop}
              className="group flex items-center gap-3 px-6 py-3 border-2 border-black bg-white font-bold uppercase tracking-wider transition-all duration-300 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Top
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 px-4 md:px-12 lg:px-0">
          <p className="text-xs font-mono text-black/40 uppercase tracking-widest text-center md:text-left">
            (c) {currentYear} Abdelrahman Abozena
          </p>
          <p className="text-xs font-mono text-black/40 flex items-center justify-center gap-2 uppercase tracking-widest text-center md:text-right">
            Designed and Engineered with
            <Heart className="w-3.5 h-3.5 text-black fill-black animate-heartbeat inline-block" />
            by Abdelrahman
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;