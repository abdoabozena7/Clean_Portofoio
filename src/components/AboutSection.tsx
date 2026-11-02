import { profileContent } from "@/data/profileContent";
import SectionBlock from "./SectionBlock";
import AnimatedAvatar from "./AnimatedAvatar";

const AboutSection = () => (
  <SectionBlock id="about" title="About me">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
      <AnimatedAvatar />

      <div className="flex-1 min-w-0 space-y-6">
        {profileContent.about.map((paragraph) => (
          <p key={paragraph} className="body-text max-w-2xl">
            {paragraph.split("Microsoft").map((part, index) => (
              <span key={index}>
                {index > 0 && (
                  <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                    <img
                      src={`${import.meta.env.BASE_URL}images/microsoft-symbol.svg`}
                      width="16"
                      height="16"
                      alt=""
                      className="inline-block relative top-px"
                    />
                    Microsoft
                  </span>
                )}
                {part}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  </SectionBlock>
);

export default AboutSection;
