import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bar, Empty, PageHeader, Pill } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { selectCls } from "@/components/finance/transaction-form";
import { useFinance } from "@/lib/finance/store";
import { fmt, goalProgress, recommendedMonthly } from "@/lib/finance/calc";
import type { Goal, GoalKind, Priority } from "@/lib/finance/types";
import { toast } from "sonner";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals & Purchases — Common Ground" },
      { name: "description", content: "Shared savings targets and debt payoff plans." },
      { property: "og:title", content: "Goals & Purchases — Common Ground" },
      { property: "og:description", content: "Shared savings targets and debt payoff plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoalsPage,
});

type Draft = { kind: GoalKind; name: string; targetAmount: string; startingAmount: string; monthlyTarget: string; targetDate: string; priority: Priority };

function GoalsPage() {
  const { state, month, saveGoal, deleteGoal } = useFinance();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Draft>({ kind: "savings", name: "", targetAmount: "", startingAmount: "0", monthlyTarget: "", targetDate: "", priority: "medium" });
  const [err, setErr] = useState("");

  const submit = () => {
    const target = Number(d.targetAmount);
    if (!d.name.trim()) return setErr("Give the goal a name.");
    if (!(target > 0)) return setErr("Target must be more than zero.");
    if (!d.targetDate) return setErr("Pick a target date.");
    const g: Omit<Goal, "id" | "createdAt"> = {
      kind: d.kind, name: d.name.trim(), targetAmount: target, startingAmount: Number(d.startingAmount) || 0,
      monthlyTarget: Number(d.monthlyTarget) || 0, targetDate: d.targetDate, priority: d.priority,
    };
    saveGoal(g);
    toast.success("Goal added");
    setOpen(false);
    setErr("");
  };

  const goals = [...state.goals].sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.priority] - ({ high: 0, medium: 1, low: 2 })[b.priority]);

  return (
    <div>
      <PageHeader eyebrow="Saving & paying off" title="Goals">
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New goal</Button>
      </PageHeader>
      {goals.length === 0 ? (
        <Empty>No goals yet.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const p = goalProgress(g, state.transactions);
            const rec = recommendedMonthly(p.remaining, month, g.targetDate);
            return (
              <article key={g.id} className="rounded-2xl border bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="mb-1 flex gap-1.5">
                      <Pill tone={g.kind === "payoff" ? "warning" : "lavender"}>{g.kind === "payoff" ? "Payoff" : "Savings"}</Pill>
                      <Pill>{g.priority} priority</Pill>
                    </div>
                    <h3 className="font-display text-2xl">{g.name}</h3>
                  </div>
                  <button aria-label="Delete goal" className="rounded p-1.5 hover:bg-muted" onClick={() => { deleteGoal(g.id); toast.success("Goal removed"); }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="tabular mb-2 text-sm">{fmt(p.progress)} of {fmt(g.targetAmount)} <span className="text-muted-foreground">· {Math.round(p.pct)}%</span></p>
                <Bar pct={p.pct} tone={g.kind === "payoff" ? "positive" : "lavender"} />
                <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Remaining</dt><dd className="tabular text-sm">{fmt(p.remaining)}</dd></div>
                  <div><dt className="text-muted-foreground">Needed / mo</dt><dd className="tabular text-sm">{fmt(rec)}</dd></div>
                  <div><dt className="text-muted-foreground">By</dt><dd className="text-sm">{g.targetDate}</dd></div>
                </dl>
                {g.monthlyTarget > 0 && rec > g.monthlyTarget && <p className="mt-3 text-xs text-warning">Current plan of {fmt(g.monthlyTarget)}/mo won't reach this in time.</p>}
              </article>
            );
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><select className={selectCls} value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as GoalKind })}><option value="savings">Savings</option><option value="payoff">Debt payoff</option></select></div>
              <div><Label>Priority</Label><select className={selectCls} value={d.priority} onChange={(e) => setD({ ...d, priority: e.target.value as Priority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            </div>
            <div><Label>Name</Label><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{d.kind === "payoff" ? "Amount owed" : "Target"}</Label><Input type="number" value={d.targetAmount} onChange={(e) => setD({ ...d, targetAmount: e.target.value })} /></div>
              <div><Label>Already {d.kind === "payoff" ? "paid" : "saved"}</Label><Input type="number" value={d.startingAmount} onChange={(e) => setD({ ...d, startingAmount: e.target.value })} /></div>
              <div><Label>Monthly plan</Label><Input type="number" value={d.monthlyTarget} onChange={(e) => setD({ ...d, monthlyTarget: e.target.value })} /></div>
              <div><Label>Target date</Label><Input type="date" value={d.targetDate} onChange={(e) => setD({ ...d, targetDate: e.target.value })} /></div>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button onClick={submit}>Save goal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
