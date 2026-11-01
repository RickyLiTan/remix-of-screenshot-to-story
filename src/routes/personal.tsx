import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Bar, Empty, MonthPicker, PageHeader, Panel, Stat } from "@/components/finance/ui";
import { TransactionList } from "@/components/finance/transaction-list";
import { TransactionDialog } from "@/components/finance/transaction-form";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/lib/finance/store";
import { categorySpend, fmt, monthSummary, txInMonth } from "@/lib/finance/calc";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Personal Spending — Common Ground" },
      { name: "description", content: "Each partner's personal allowance and spending." },
      { property: "og:title", content: "Personal Spending — Common Ground" },
      { property: "og:description", content: "Each partner's personal allowance and spending." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PersonalPage,
});

function PersonalPage() {
  const { state, month } = useFinance();
  const [adding, setAdding] = useState(false);
  const s = monthSummary(state, month);
  const cats = state.categories.filter((c) => c.group === "personal");

  return (
    <div>
      <PageHeader eyebrow="Your own money" title="Personal">
        <MonthPicker />
        <Button onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        {s.members.map((m) => {
          const isViewer = m.member.id === state.viewerId;
          const hidden = !isViewer && state.visibility !== "shared";
          const items = txInMonth(state.transactions, month).filter((t) => t.scope === "personal" && t.memberId === m.member.id);
          return (
            <div key={m.member.id} className="space-y-4">
              <h2 className="font-display text-2xl">{m.member.name}{isViewer && <span className="eyebrow ml-2">You</span>}</h2>
              {hidden && state.visibility === "private" ? (
                <Empty>{m.member.name} keeps personal spending private.</Empty>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Allowance" value={fmt(m.personal)} />
                    <Stat label="Spent" value={fmt(m.spent)} />
                    <Stat label="Left" value={fmt(m.remainingPersonal)} tone={m.remainingPersonal >= 0 ? "positive" : "negative"} />
                  </div>
                  <Bar pct={m.personal > 0 ? (m.spent / m.personal) * 100 : 0} tone="auto" />
                  {hidden ? (
                    <Empty>Only totals are shared.</Empty>
                  ) : (
                    <Panel title="By category">
                      <ul className="space-y-2 text-sm">
                        {cats.map((c) => {
                          const v = categorySpend(items, c.id, month, "personal");
                          return v > 0 ? <li key={c.id} className="flex justify-between"><span>{c.name}</span><span className="tabular">{fmt(v, true)}</span></li> : null;
                        })}
                      </ul>
                      <div className="mt-4"><TransactionList items={items} filters={false} /></div>
                    </Panel>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <TransactionDialog open={adding} onOpenChange={setAdding} initial={{ scope: "personal" }} />
    </div>
  );
}
