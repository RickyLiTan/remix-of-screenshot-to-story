import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, Stat } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/lib/finance/store";
import { fmt, incomeFor, splitIncome } from "@/lib/finance/calc";
import type { Member } from "@/lib/finance/types";

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
      const r = incomeFor(state.incomes, m.id, month);
      if (!r) return acc;
      const s = splitIncome(r.amount, r.householdPct);
      return { income: acc.income + r.amount, pool: acc.pool + s.household };
    },
    { income: 0, pool: 0 },
  );
  return (
    <div>
      <PageHeader eyebrow={`Effective from ${month}`} title="Income & household pool" />
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Stat label="Combined take-home" value={fmt(totals.income)} />
        <Stat label="Household pool" value={fmt(totals.pool)} tone="positive" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {state.members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const { state, month, updateMember, addIncome } = useFinance();
  const rec = incomeFor(state.incomes, member.id, month);
  const [name, setName] = useState(member.name);
  const [amount, setAmount] = useState(String(rec?.amount ?? 0));
  const [pct, setPct] = useState(String(rec?.householdPct ?? 80));
  const a = Number(amount) || 0;
  const p = Math.min(100, Math.max(0, Number(pct) || 0));
  const split = splitIncome(a, p);

  const save = () => {
    const n = name.trim() || member.name;
    const initials = n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    updateMember(member.id, { name: n, initials });
    if (!rec || rec.amount !== a || rec.householdPct !== p) addIncome({ memberId: member.id, month, amount: a, householdPct: p });
    toast.success(`Saved ${n}'s settings`);
  };

  return (
    <Panel title={member.name}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`n-${member.id}`}>Name</Label>
          <Input id={`n-${member.id}`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`a-${member.id}`}>Monthly take-home income</Label>
          <Input id={`a-${member.id}`} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`p-${member.id}`}>% into household pool</Label>
          <div className="flex gap-2">
            <Input id={`p-${member.id}`} type="number" min="0" max="100" value={pct} onChange={(e) => setPct(e.target.value)} />
            {[50, 70, 80, 100].map((v) => (
              <Button key={v} type="button" variant={p === v ? "default" : "outline"} size="sm" onClick={() => setPct(String(v))}>
                {v}%
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {fmt(split.household)} to the household pool · {fmt(split.personal)} personal spending
        </p>
        <Button onClick={save}>Save</Button>
      </div>
    </Panel>
  );
}
