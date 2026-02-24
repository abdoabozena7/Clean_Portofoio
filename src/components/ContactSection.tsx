import { useState } from "react";
import SectionBlock from "./SectionBlock";
import { Mail, MapPin, Copy, Check, Linkedin, Globe, Github } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [copied, setCopied] = useState(false);

  const contactEmail = "boodyabozena@gmail.com";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = encodeURIComponent(`Portfolio contact from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nMessage: ${form.message}`,
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SectionBlock id="contact" title="Get in touch">
      <div className="grid md:grid-cols-2 gap-8 md:gap-20">
        <div className="space-y-8 md:space-y-10">
          <p className="text-foreground/80 leading-relaxed font-light text-lg">
            I am open to backend, AI, and machine learning opportunities.
            Whether you want to collaborate, discuss a role, or ask a question,
            feel free to reach out.
          </p>

          <div className="space-y-6">
            <div className="group flex items-center gap-4 p-4 border border-foreground/10 bg-white/50 hover:border-black transition-colors duration-300">
              <div className="p-3 bg-black text-white self-start">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest text-foreground/50 mb-1">
                  Email
                </p>
                <p className="font-mono text-sm break-all">{contactEmail}</p>
              </div>
              <button
                onClick={copyEmail}
                className="p-2 hover:bg-black/5 rounded-full transition-colors relative"
                title="Copy email"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-foreground/40" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 border border-foreground/10 bg-white/50 hover:border-black transition-colors duration-300">
              <div className="p-3 bg-black text-white self-start">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-foreground/50 mb-1">
                  Location
                </p>
                <p className="font-mono text-sm">Giza, Egypt</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/50 mb-4">
              Connect
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Github, href: "https://github.com/abdoabozena7" },
                {
                  Icon: Linkedin,
                  href: "https://www.linkedin.com/in/abdelrahman-abozena",
                },
                {
                  Icon: Globe,
                  href: "https://abdoabozena7.github.io/Instafolio",
                },
                { Icon: Mail, href: "mailto:boodyabozena@gmail.com" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-foreground/20 hover:bg-black hover:text-white transition-all duration-300 hover:-translate-y-1"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group relative">
            <input
              type="text"
              required
              placeholder=" "
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="peer w-full bg-transparent border-2 border-foreground/10 px-4 py-4 text-foreground focus:outline-none focus:border-black transition-colors"
            />
            <label className="absolute left-4 top-4 text-foreground/40 text-sm uppercase tracking-widest transition-all duration-300 pointer-events-none peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:text-black peer-focus:bg-background peer-focus:px-2 peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-2">
              Your Name
            </label>
          </div>

          <div className="group relative">
            <input
              type="email"
              required
              placeholder=" "
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="peer w-full bg-transparent border-2 border-foreground/10 px-4 py-4 text-foreground focus:outline-none focus:border-black transition-colors"
            />
            <label className="absolute left-4 top-4 text-foreground/40 text-sm uppercase tracking-widest transition-all duration-300 pointer-events-none peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:text-black peer-focus:bg-background peer-focus:px-2 peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-2">
              Email Address
            </label>
          </div>

          <div className="group relative">
            <textarea
              required
              rows={5}
              placeholder=" "
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="peer w-full bg-transparent border-2 border-foreground/10 px-4 py-4 text-foreground focus:outline-none focus:border-black transition-colors resize-none"
            />
            <label className="absolute left-4 top-4 text-foreground/40 text-sm uppercase tracking-widest transition-all duration-300 pointer-events-none peer-focus:-translate-y-7 peer-focus:text-xs peer-focus:text-black peer-focus:bg-background peer-focus:px-2 peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-2">
              Message
            </label>
          </div>

          <button
            type="submit"
            className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-black text-white font-mono uppercase tracking-widest overflow-hidden transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
          >
            <span className="relative z-10 font-bold">Send via Email</span>
            <Mail className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-neutral-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </form>
      </div>
    </SectionBlock>
  );
};

export default ContactSection;
