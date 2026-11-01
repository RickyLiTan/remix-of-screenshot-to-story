import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Bar, MonthPicker, PageHeader, Panel, Stat } from "@/components/finance/ui";
import { TransactionList } from "@/components/finance/transaction-list";
import { TransactionDialog } from "@/components/finance/transaction-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/lib/finance/store";
import { budgetFor, categorySpend, fmt, monthSummary, sum, txInMonth } from "@/lib/finance/calc";
import { GROUP_LABEL, type CategoryGroup } from "@/lib/finance/types";
import { downloadCsv } from "@/lib/finance/csv";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Household Budget — Common Ground" },
      { name: "description", content: "Plan and track shared household spending by category." },
      { property: "og:title", content: "Household Budget — Common Ground" },
      { property: "og:description", content: "Plan and track shared household spending by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BudgetPage,
});

const GROUPS: CategoryGroup[] = ["fixed", "variable", "debt", "savings"];

function BudgetPage() {
  const { state, month, setBudget } = useFinance();
  const [adding, setAdding] = useState(false);
  const s = monthSummary(state, month);
  const household = txInMonth(state.transactions, month).filter((t) => t.scope === "household");
  const totalBudget = sum(state.categories.filter((c) => c.group !== "personal").map((c) => budgetFor(state, c.id, month)));

  const exportCsv = () =>
    downloadCsv(`household-${month}.csv`, [
      ["Date", "Description", "Category", "Type", "Member", "Amount"],
      ...household.map((t) => [t.date, t.description, state.categories.find((c) => c.id === t.categoryId)?.name ?? "", t.type, state.members.find((m) => m.id === t.memberId)?.name ?? "", t.amount]),
    ]);

  return (
    <div>
      <PageHeader eyebrow="Household" title="Budget">
        <MonthPicker />
        <Button variant="outline" onClick={exportCsv}>Export</Button>
        <Button onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Household pool" value={fmt(s.household)} />
        <Stat label="Budgeted" value={fmt(totalBudget)} hint={totalBudget > s.household ? "Over the pool" : "Within the pool"} />
        <Stat label="Spent" value={fmt(s.expenses)} />
        <Stat label="Left in pool" value={fmt(s.remaining)} tone={s.remaining >= 0 ? "positive" : "negative"} />
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const cats = state.categories.filter((c) => c.group === g);
          return (
            <Panel key={g} title={GROUP_LABEL[g]}>
              <ul className="space-y-4">
                {cats.map((c) => {
                  const budget = budgetFor(state, c.id, month);
                  const spent = categorySpend(state.transactions, c.id, month);
                  return (
                    <li key={c.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span>{c.name}</span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="tabular">{fmt(spent)} /</span>
                          <Input
                            aria-label={`${c.name} budget`}
                            type="number"
                            min={0}
                            defaultValue={budget}
                            key={`${c.id}-${month}-${budget}`}
                            className="h-7 w-24 text-right tabular"
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v) && v >= 0 && v !== budget) setBudget(c.id, month, v);
                            }}
                          />
                        </span>
                      </div>
                      <Bar pct={budget > 0 ? (spent / budget) * 100 : spent > 0 ? 101 : 0} tone="auto" />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          );
        })}
      </div>
      <Panel title="Household transactions">
        <TransactionList items={household} />
      </Panel>
      <TransactionDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
