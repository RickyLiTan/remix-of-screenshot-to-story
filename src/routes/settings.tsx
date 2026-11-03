import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/lib/finance/store";
import { fmt, incomeStreamsFor, memberAllocation, splitIncome } from "@/lib/finance/calc";
import type { IncomeRecord, Member } from "@/lib/finance/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Income & Household Pool — Common Ground" },
      { name: "description", content: "Set each partner's name, take-home income and household split." },
      { property: "og:title", content: "Income & Household Pool — Common Ground" },
      { property: "og:description", content: "Set each partner's name, take-home income and household split." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, month } = useFinance();
  const totals = state.members.reduce(
    (acc, m) => {
      const a = memberAllocation(state, m.id, month);
      return { income: acc.income + a.income, pool: acc.pool + a.household };
    },
    { income: 0, pool: 0 },
  );
  return (
    <div>
      <PageHeader eyebrow={`Selected month: ${month}`} title="Income & household pool" />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Stat label="Combined take-home" value={fmt(totals.income)} />
        <Stat label="Household pool" value={fmt(totals.pool)} tone="positive" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {state.members.map((m) => (
          <MemberCard
            key={`${m.id}-${month}-${incomeStreamsFor(state.incomes, m.id, month).map((r) => r.id).join(",")}`}
            member={m}
          />
        ))}
      </div>
    </div>
  );
}

type Draft = { streamId: string; label: string; amount: string; pct: string; frequency: "fixed" | "month-only"; rec?: IncomeRecord };

function MemberCard({ member }: { member: Member }) {
  const { state, month, updateMember, addIncome } = useFinance();
  const recs = incomeStreamsFor(state.incomes, member.id, month);
  const [name, setName] = useState(member.name);
  const [rows, setRows] = useState<Draft[]>(() =>
    recs.map((r) => ({
      streamId: r.streamId ?? "main", label: r.label ?? "Salary", amount: String(r.amount),
      pct: String(r.householdPct), frequency: r.frequency ?? "fixed", rec: r,
    })),
  );
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const patch = (i: number, d: Partial<Draft>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...d } : r)));
  const parsed = rows.map((r) => ({ ...r, a: Number(r.amount) || 0, p: Math.min(100, Math.max(0, Number(r.pct) || 0)) }));
  const total = parsed.reduce((t, r) => t + r.a, 0);
  const pool = parsed.reduce((t, r) => t + splitIncome(r.a, r.p).household, 0);

  const addRow = () =>
    setRows((rs) => [...rs, { streamId: `s_${Date.now().toString(36)}`, label: "", amount: "0", pct: "80", frequency: "fixed" }]);
  const removeRow = (i: number) => {
    const r = rows[i]!;
    if (r.rec) setRemovedIds((x) => [...x, r.streamId]);
    setRows((rs) => rs.filter((_, j) => j !== i));
  };

  const save = () => {
    const n = name.trim() || member.name;
    const initials = n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    updateMember(member.id, { name: n, initials });
    for (const r of parsed) {
      const label = r.label.trim() || "Income";
      const old = r.rec;
      if (!old || old.amount !== r.a || old.householdPct !== r.p || (old.frequency ?? "fixed") !== r.frequency || (old.label ?? "Salary") !== label) {
        addIncome({ memberId: member.id, month, amount: r.a, householdPct: r.p, frequency: r.frequency, streamId: r.streamId, label });
      }
    }
    for (const id of removedIds) {
      addIncome({ memberId: member.id, month, amount: 0, householdPct: 0, frequency: "fixed", streamId: id, removed: true });
    }
    toast.success(`Saved ${n}'s income`);
  };

  return (
    <Panel title={member.name}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`n-${member.id}`}>Name</Label>
          <Input id={`n-${member.id}`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {parsed.length === 0 && <p className="text-sm text-muted-foreground">No income yet for this month.</p>}
        {parsed.map((r, i) => (
          <div key={r.streamId} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`l-${r.streamId}`}>Income source</Label>
                <Input id={`l-${r.streamId}`} placeholder="e.g. Salary, Freelance" value={r.label} onChange={(e) => patch(i, { label: e.target.value })} />
              </div>
              <div className="w-32 space-y-1.5">
                <Label htmlFor={`a-${r.streamId}`}>Amount</Label>
                <Input id={`a-${r.streamId}`} type="number" min="0" value={r.amount} onChange={(e) => patch(i, { amount: e.target.value })} />
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove income source" onClick={() => removeRow(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Income frequency">
              <Button type="button" size="sm" variant={r.frequency === "fixed" ? "default" : "outline"} aria-pressed={r.frequency === "fixed"} onClick={() => patch(i, { frequency: "fixed" })}>
                Fixed monthly
              </Button>
              <Button type="button" size="sm" variant={r.frequency === "month-only" ? "default" : "outline"} aria-pressed={r.frequency === "month-only"} onClick={() => patch(i, { frequency: "month-only" })}>
                This month only
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`p-${r.streamId}`} className="shrink-0">% to pool</Label>
              <Input id={`p-${r.streamId}`} className="w-20" type="number" min="0" max="100" value={r.pct} onChange={(e) => patch(i, { pct: e.target.value })} />
              {[50, 80, 100].map((v) => (
                <Button key={v} type="button" variant={r.p === v ? "default" : "outline"} size="sm" onClick={() => patch(i, { pct: String(v) })}>
                  {v}%
                </Button>
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" /> Add income source
        </Button>
        <p className="text-sm text-muted-foreground">
          Total {fmt(total)} · {fmt(pool)} to the household pool · {fmt(total - pool)} personal spending
        </p>
        <Button onClick={save}>Save</Button>
      </div>
    </Panel>
  );
}
