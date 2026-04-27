type FaqItemProps = {
  question: string;
  answer: string;
};

export function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <article className="border-t border-border py-6 first:border-t-0">
      <h3 className="text-body-lg font-black leading-tight">{question}</h3>
      <p className="mt-3 text-body-sm leading-6 text-muted">{answer}</p>
    </article>
  );
}
