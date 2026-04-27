import { Quote } from "lucide-react";
import { MarketingCard } from "@/components/marketing/card";

type TestimonialCardProps = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export function TestimonialCard({
  quote,
  name,
  role,
  company,
}: TestimonialCardProps) {
  return (
    <MarketingCard className="shadow-none">
      <Quote aria-hidden="true" className="size-6 text-teal" />
      <blockquote className="mt-5 text-body leading-7 text-ink-soft">
        &quot;{quote}&quot;
      </blockquote>
      <figcaption className="mt-6 border-t border-border pt-4">
        <p className="text-body-sm font-black text-ink">{name}</p>
        <p className="mt-1 text-caption font-bold uppercase text-muted">
          {role} - {company}
        </p>
      </figcaption>
    </MarketingCard>
  );
}
