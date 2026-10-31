import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance } from "@/lib/finance/store";
import { monthLabel, shiftMonth } from "@/lib/finance/calc";
import { currentMonth } from "@/lib/finance/store";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-medium">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "positive" | "negative" | "lavender" }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "tabular mt-3 font-display text-3xl",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-destructive",
          tone === "lavender" && "text-lavender",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Bar({ pct, tone = "positive" }: { pct: number; tone?: "positive" | "lavender" | "auto" }) {
  const p = Math.max(0, Math.min(100, pct));
  const color = tone === "lavender" ? "bg-lavender" : tone === "auto" ? (pct > 100 ? "bg-destructive" : pct > 85 ? "bg-warning" : "bg-positive") : "bg-positive";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "positive" | "lavender" | "warning" | "negative" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "positive" && "bg-positive-soft text-positive",
        tone === "lavender" && "bg-lavender-soft text-lavender",
        tone === "warning" && "bg-warning-soft text-warning",
        tone === "negative" && "bg-destructive/10 text-destructive",
      )}
    >
      {children}
    </span>
  );
}

export function MonthPicker() {
  const { month, setMonth } = useFinance();
  const atCurrent = month >= currentMonth();
  return (
    <div className="flex items-center rounded-full border bg-card">
      <button aria-label="Previous month" className="rounded-full p-2 hover:bg-muted" onClick={() => setMonth(shiftMonth(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-medium">{monthLabel(month)}</span>
      <button aria-label="Next month" disabled={atCurrent} className="rounded-full p-2 hover:bg-muted disabled:opacity-30" onClick={() => setMonth(shiftMonth(month, 1))}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
