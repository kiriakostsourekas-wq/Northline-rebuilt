import type { ReactNode } from "react";

type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
};

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
}: AuthFieldProps) {
  return (
    <label className="grid gap-2 text-body-sm font-bold text-ink">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
      />
    </label>
  );
}

type AuthSubmitProps = {
  children: ReactNode;
};

export function AuthSubmit({ children }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-teal px-5 py-3 text-body-sm font-black text-white shadow-card transition-colors hover:bg-teal-strong"
    >
      {children}
    </button>
  );
}
