import { type ReactNode } from "react";

interface SectionBlockProps {
  id: string;
  title: string;
  children: ReactNode;
}

const SectionBlock = ({ id, title, children }: SectionBlockProps) => {
  return (
    <section
      id={id}
      data-construction-section
      className="max-w-4xl mx-auto px-6 py-16 md:py-32"
    >
      <h2 className="section-title mb-12">{title}.</h2>
      {children}
    </section>
  );
};

export default SectionBlock;
