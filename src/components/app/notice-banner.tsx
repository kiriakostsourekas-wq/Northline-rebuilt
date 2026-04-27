import { CheckCircle2, TriangleAlert } from "lucide-react";

type NoticeBannerProps = {
  tone: "success" | "error";
  children: string;
};

export function NoticeBanner({ tone, children }: NoticeBannerProps) {
  const Icon = tone === "success" ? CheckCircle2 : TriangleAlert;
  const className =
    tone === "success"
      ? "border-teal/25 bg-teal-soft text-teal-strong"
      : "border-rose/25 bg-rose-soft text-rose";

  return (
    <section
      role={tone === "success" ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-lg border p-4 text-body-sm font-bold leading-6 ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </section>
  );
}
