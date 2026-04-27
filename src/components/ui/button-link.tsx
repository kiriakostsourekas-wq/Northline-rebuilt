import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  icon?: IconComponent;
  tone?: "primary" | "secondary" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  analyticsEvent?: string;
  analyticsLabel?: string;
  analyticsLocation?: string;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "target" | "rel">;

const toneClassNames = {
  primary:
    "bg-teal text-white shadow-card hover:bg-teal-strong",
  secondary:
    "border border-border bg-raised text-ink hover:border-teal/45 hover:bg-white",
  dark: "bg-ink text-canvas hover:bg-ink-soft",
  ghost: "text-ink hover:bg-subtle",
};

const sizeClassNames = {
  sm: "min-h-9 px-3 py-2 text-caption",
  md: "min-h-11 px-5 py-3 text-body-sm",
  lg: "min-h-12 px-6 py-3 text-body-sm",
};

export function ButtonLink({
  href,
  children,
  icon: Icon,
  tone = "primary",
  size = "md",
  className,
  analyticsEvent,
  analyticsLabel,
  analyticsLocation,
  target,
  rel,
  ...props
}: ButtonLinkProps) {
  const classNames = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal/25",
    toneClassNames[tone],
    sizeClassNames[size],
    className,
  );

  const isInternal = href.startsWith("/") || href.startsWith("#");
  const content = (
    <>
      <span>{children}</span>
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
    </>
  );

  if (!isInternal) {
    return (
      <a
        href={href}
        className={classNames}
        target={target}
        rel={rel}
        data-analytics-event={analyticsEvent}
        data-analytics-label={analyticsLabel}
        data-analytics-location={analyticsLocation}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={classNames}
      target={target}
      rel={rel}
      data-analytics-event={analyticsEvent}
      data-analytics-label={analyticsLabel}
      data-analytics-location={analyticsLocation}
      {...props}
    >
      {content}
    </Link>
  );
}
