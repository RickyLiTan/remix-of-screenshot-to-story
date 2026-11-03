import { createFileRoute } from "@tanstack/react-router";
import { MonthPicker, PageHeader, Panel, Stat } from "@/components/finance/ui";
import { TransactionList } from "@/components/finance/transaction-list";
import { useFinance } from "@/lib/finance/store";
import { fmt, monthSummary, txInMonth } from "@/lib/finance/calc";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Overview — Common Ground" }, { name: "description", content: "Your household's month at a glance." }, { property: "og:title", content: "Overview — Common Ground" }, { property: "og:description", content: "Your household's month at a glance." }] }),
  component: Overview,
});

function Overview() {
  const { state, month } = useFinance();
  const s = monthSummary(state, month);
  return (
    <div>
      <PageHeader eyebrow="Overview" title="This month, together"><MonthPicker /></PageHeader>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Take-home income" value={fmt(s.income)} />
        <Stat label="Household share" value={fmt(s.household)} />
        <Stat label="Household spending" value={fmt(s.expenses)} />
        <Stat label="Remaining" value={fmt(s.remaining)} tone={s.remaining >= 0 ? "positive" : "negative"} />
        {s.members.map((m) => (
          <Stat key={m.member.id} label={`${m.member.name}'s personal left`} value={`${fmt(m.remainingPersonal)} of ${fmt(m.personal)}`} tone={m.remainingPersonal >= 0 ? "positive" : "negative"} />
        ))}
      </div>
      <Panel title="Recent household transactions">
        <TransactionList items={txInMonth(state.transactions, month).filter((t) => t.scope === "household").slice(0, 10)} filters={false} />
      </Panel>
    </div>
  );
}
