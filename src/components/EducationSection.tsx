import { education } from "@/data/profileContent";
import CredentialList from "./CredentialList";
import SectionBlock from "./SectionBlock";

const EducationSection = () => (
  <SectionBlock id="education" title="Education">
    <CredentialList items={education} group="education" />
  </SectionBlock>
);

export default EducationSection;
