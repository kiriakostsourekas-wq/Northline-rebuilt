"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  Inbox,
  PlugZap,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

const navItems: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  startsWith?: string;
}> = [
  { label: "Dashboard", href: "/app/dashboard", icon: BarChart3 },
  {
    label: "Setup",
    href: "/app/onboarding/business-basics",
    icon: SlidersHorizontal,
    startsWith: "/app/onboarding",
  },
  { label: "Inbox", href: "/app/inbox", icon: Inbox },
  { label: "Knowledge", href: "/app/knowledge", icon: BookOpenText },
  { label: "Booking", href: "/app/booking", icon: CalendarDays },
  { label: "Destinations", href: "/app/destinations", icon: PlugZap },
  { label: "Privacy", href: "/app/privacy", icon: ShieldCheck },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="App navigation" className="grid gap-1">
      {navItems.map((item) => {
        const active = item.startsWith
          ? pathname.startsWith(item.startsWith)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-body-sm font-bold transition-colors ${
              active
                ? "bg-teal-soft text-teal-strong"
                : "text-muted hover:bg-subtle hover:text-ink"
            }`}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
