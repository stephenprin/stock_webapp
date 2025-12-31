"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQSectionProps {
  items: FAQItem[];
  type?: "single" | "multiple";
  defaultValue?: string;
  className?: string;
}

export default function FAQSection({
  items,
  type = "single",
  defaultValue,
  className,
}: FAQSectionProps) {
  if (type === "multiple") {
    return (
      <Accordion
        type="multiple"
        defaultValue={defaultValue ? [defaultValue] : undefined}
        className={className}
      >
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border border-gray-700 rounded-lg bg-gray-800 px-4 sm:px-6 mb-2 data-[state=open]:bg-gray-800/80"
          >
            <AccordionTrigger className="hover:no-underline text-left text-sm sm:text-base py-3 sm:py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm sm:text-base leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue}
      className={className}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border border-gray-700 rounded-lg bg-gray-800 px-4 sm:px-6 mb-2 data-[state=open]:bg-gray-800/80"
        >
          <AccordionTrigger className="hover:no-underline text-left text-sm sm:text-base py-3 sm:py-4">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm sm:text-base leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

