import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import EducationSection from "@/components/EducationSection";
import HonorsSection from "@/components/HonorsSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactSection from "@/components/ContactSection";
import ScrollToTop from "@/components/ScrollToTop";
import Terminal from "@/components/Terminal";
import Finale from "@/components/Finale";
import ArrowPointerCursor from "@/components/ArrowPointerCursor";
import AgentConstruction from "@/components/AgentConstruction";
import AdaptiveBrowsing from "@/components/AdaptiveBrowsing";
import "@/styles/palette.css";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <ArrowPointerCursor />
      <ScrollToTop />
      <Terminal />
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <EducationSection />
      <HonorsSection />
      <ProjectsSection />
      <ContactSection />
      <Finale />
      <AdaptiveBrowsing />
      <AgentConstruction />
    </div>
  );
};

export default Index;
