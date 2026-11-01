import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/store";
import { categorySpend, fmt, monthLabel, monthSummary, shiftMonth } from "@/lib/finance/calc";
import { downloadCsv } from "@/lib/finance/csv";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & History — Common Ground" },
      { name: "description", content: "Six months of household income, spending and contributions." },
      { property: "og:title", content: "Reports & History — Common Ground" },
      { property: "og:description", content: "Six months of household income, spending and contributions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { state, month } = useFinance();
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
  const rows = months.map((m) => ({ m, ...monthSummary(state, m) }));
  const max = Math.max(1, ...rows.map((r) => Math.max(r.household, r.expenses)));
  const cats = state.categories.filter((c) => c.group !== "personal");
  const top = cats
    .map((c) => ({ c, total: months.reduce((a, m) => a + categorySpend(state.transactions, c.id, m), 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const exportAll = () =>
    downloadCsv("common-ground-transactions.csv", [
      ["Date", "Description", "Category", "Type", "Scope", "Member", "Amount", "Recurring"],
      ...[...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).map((t) => [
        t.date, t.description, state.categories.find((c) => c.id === t.categoryId)?.name ?? "", t.type, t.scope,
        state.members.find((m) => m.id === t.memberId)?.name ?? "", t.amount, t.recurring,
      ]),
    ]);

  return (
    <div>
      <PageHeader eyebrow="Looking back" title="Reports">
        <Button variant="outline" onClick={exportAll}>Export all to spreadsheet</Button>
      </PageHeader>
      <Panel title="Household pool vs spending — last 6 months" className="mb-6">
        <div className="flex h-48 items-end gap-3">
          {rows.map((r) => (
            <div key={r.m} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div className="w-1/3 rounded-t bg-lavender" style={{ height: `${(r.household / max) * 100}%` }} title={`Pool ${fmt(r.household)}`} />
                <div className={`w-1/3 rounded-t ${r.expenses > r.household ? "bg-destructive" : "bg-positive"}`} style={{ height: `${(r.expenses / max) * 100}%` }} title={`Spent ${fmt(r.expenses)}`} />
              </div>
              <span className="text-xs text-muted-foreground">{monthLabel(r.m, true)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex gap-4 text-xs text-muted-foreground"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-lavender" />Pool</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-positive" />Spent</span></p>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Monthly history">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Month</th><th className="text-right">Income</th><th className="text-right">Spent</th><th className="text-right">Left</th></tr></thead>
            <tbody className="tabular divide-y">
              {[...rows].reverse().map((r) => (
                <tr key={r.m}><td className="py-2">{monthLabel(r.m)}</td><td className="text-right">{fmt(r.income)}</td><td className="text-right">{fmt(r.expenses)}</td><td className={`text-right ${r.remaining < 0 ? "text-destructive" : "text-positive"}`}>{fmt(r.remaining)}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Top categories (6 months)">
          <ul className="space-y-2 text-sm">
            {top.map(({ c, total }) => (
              <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="tabular">{fmt(total)}</span></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
