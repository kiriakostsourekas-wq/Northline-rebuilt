export const marketingEvents = {
  ctaClick: "marketing_cta_click",
  formStart: "marketing_form_start",
  formSubmit: "marketing_form_submit",
  formSuccess: "marketing_form_success",
  formError: "marketing_form_error",
} as const;

export type MarketingEventName =
  (typeof marketingEvents)[keyof typeof marketingEvents];

export type MarketingEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsWindow = Window & {
  dataLayer?: MarketingEventProperties[];
  plausible?: (
    event: string,
    options?: { props?: MarketingEventProperties },
  ) => void;
};

export function trackMarketingEvent(
  event: MarketingEventName,
  properties: MarketingEventProperties = {},
) {
  if (typeof window === "undefined") return;

  const analyticsWindow = window as AnalyticsWindow;
  const payload = { event, ...properties };

  window.dispatchEvent(
    new CustomEvent("northline:marketing-event", {
      detail: payload,
    }),
  );

  analyticsWindow.dataLayer?.push(payload);
  analyticsWindow.plausible?.(event, { props: properties });
}
