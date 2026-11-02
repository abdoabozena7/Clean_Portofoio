import { profileContent } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import AnimatedAvatar from "./AnimatedAvatar";

const AboutSection = () => (
  <SectionBlock id="about" title="About me">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
      <AnimatedAvatar />

      <div className="flex-1">
        <p className="body-text max-w-2xl">
          {profileContent.about[0]}
        </p>
        <p className="body-text max-w-2xl mt-6">
          {profileContent.about[1]}
        </p>
      </div>
    </div>
  </SectionBlock>
);

export default AboutSection;
