"use client";

import { useEffect } from "react";
import {
  type MarketingEventName,
  trackMarketingEvent,
} from "@/lib/marketing-events";

export function AnalyticsListener() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-analytics-event]");
      const analyticsEvent = element?.dataset.analyticsEvent;
      if (!element || !analyticsEvent) return;
      if (analyticsEvent.startsWith("marketing_form_")) return;

      trackMarketingEvent(analyticsEvent as MarketingEventName, {
        label: element.dataset.analyticsLabel,
        location: element.dataset.analyticsLocation,
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
