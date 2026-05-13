"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Badge } from "@/components/marketing/badge";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function PainpointCalculator() {
  const [missedLeads, setMissedLeads] = useState(6);
  const [conversionRate, setConversionRate] = useState(20);
  const [leadValue, setLeadValue] = useState(180);

  const estimate = useMemo(() => {
    const monthlyMissedLeads = missedLeads * 4;
    const conservativeWins = monthlyMissedLeads * (conversionRate / 100);
    return Math.round(conservativeWins * leadValue);
  }, [conversionRate, leadValue, missedLeads]);

  return (
    <article className="rounded-lg border border-border bg-raised p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone="amber">Conservative estimate</Badge>
          <h3 className="mt-4 text-title-sm font-black leading-tight">
            What could slow follow-up be worth?
          </h3>
          <p className="mt-3 text-body-sm leading-6 text-muted">
            Adjust the assumptions. This is a planning tool, not a revenue
            claim.
          </p>
        </div>
        <span className="grid size-11 place-items-center rounded-md bg-amber-soft text-amber-strong">
          <Calculator aria-hidden="true" className="size-5" />
        </span>
      </div>

      <div className="mt-6 grid gap-5">
        <CalculatorSlider
          label="Missed inbound leads per week"
          value={missedLeads}
          min={1}
          max={20}
          suffix="leads"
          onChange={setMissedLeads}
        />
        <CalculatorSlider
          label="Would have converted"
          value={conversionRate}
          min={5}
          max={50}
          suffix="%"
          onChange={setConversionRate}
        />
        <CalculatorSlider
          label="Average value per converted lead"
          value={leadValue}
          min={50}
          max={1000}
          step={10}
          prefix="EUR "
          onChange={setLeadValue}
        />
      </div>

      <div className="mt-6 rounded-md border border-border bg-canvas p-4">
        <p className="text-caption font-black uppercase text-muted">
          Potential monthly leak
        </p>
        <p className="mt-2 font-mono text-title font-black text-ink">
          {formatter.format(estimate)}
        </p>
        <p className="mt-2 text-caption leading-5 text-muted">
          Based on {missedLeads * 4} missed conversations per month and a{" "}
          {conversionRate}% conservative conversion assumption.
        </p>
      </div>
    </article>
  );
}

function CalculatorSlider({
  label,
  value,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-caption font-black uppercase text-muted">
        <span>{label}</span>
        <span className="font-mono text-ink">
          {prefix}
          {value}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-teal"
      />
    </label>
  );
}
