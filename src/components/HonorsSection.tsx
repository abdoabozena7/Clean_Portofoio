import { honors } from "@/data/profileContent";
import CredentialList from "./CredentialList";
import SectionBlock from "./SectionBlock";

const HonorsSection = () => (
  <SectionBlock id="honors" title="Honors & Certifications">
    <CredentialList items={honors} group="honors" />
  </SectionBlock>
);

export default HonorsSection;
