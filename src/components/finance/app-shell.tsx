import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, Home, PiggyBank, User, Wallet, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/lib/finance/store";

const nav = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/budget", label: "Household Budget", icon: Wallet },
  { to: "/goals", label: "Goals & Purchases", icon: PiggyBank },
  { to: "/personal", label: "Personal Spending", icon: User },
  { to: "/reports", label: "Reports & History", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state, setViewer, resetDemo } = useFinance();
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar p-6 md:flex">
        <Link to="/" className="mb-10 block">
          <span className="font-display text-3xl">Common Ground</span>
          <span className="eyebrow mt-1 block">Household finance</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                path === to && "bg-sidebar-accent font-medium text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <div>
            <p className="eyebrow mb-2">Viewing as</p>
            <div className="flex gap-1 rounded-full border bg-card p-1">
              {state.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setViewer(m.id)}
                  className={cn("flex-1 rounded-full px-3 py-1 text-xs", state.viewerId === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <DemoBadge onReset={resetDemo} />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <span className="font-display text-2xl">Common Ground</span>
        <select
          aria-label="Viewing as"
          className="rounded-full border bg-card px-3 py-1 text-xs"
          value={state.viewerId}
          onChange={(e) => setViewer(e.target.value)}
        >
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>
              Viewing as {m.name}
            </option>
          ))}
        </select>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-dashed bg-lavender-soft/60 px-4 py-2 text-xs text-accent-foreground md:hidden">
            <FlaskConical className="h-3.5 w-3.5" /> Demo data — saved only in this browser.
          </div>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-background/95 backdrop-blur md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground", path === to && "text-foreground")}>
            <Icon className="h-5 w-5" />
            {label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function DemoBadge({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl border border-dashed bg-lavender-soft/60 p-3 text-xs text-accent-foreground">
      <p className="flex items-center gap-1.5 font-medium">
        <FlaskConical className="h-3.5 w-3.5" /> Demo data mode
      </p>
      <p className="mt-1 opacity-80">Fictional records, saved only in this browser. Live sync is not connected.</p>
      <button
        className="mt-2 underline underline-offset-2"
        onClick={() => {
          if (confirm("Reset all demo data to the original sample records?")) onReset();
        }}
      >
        Reset demo data
      </button>
    </div>
  );
}
