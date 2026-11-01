import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Stat } from "@/components/finance/ui";
import { useFinance } from "@/lib/finance/store";
import { fmt, netWorth } from "@/lib/finance/calc";
import { seedAccounts } from "@/lib/finance/seed";
import { ACCOUNT_TYPE_LABEL, DEBT_ACCOUNT_TYPES } from "@/lib/finance/types";

export const Route = createFileRoute("/net-worth")({
  head: () => ({
    meta: [
      { title: "Net Worth — Common Ground" },
      { name: "description", content: "Your household's savings, investments and debts in one place." },
      { property: "og:title", content: "Net Worth — Common Ground" },
      { property: "og:description", content: "Your household's savings, investments and debts in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NetWorthPage,
});

function NetWorthPage() {
  const { state } = useFinance();
  const accounts = state.accounts ?? seedAccounts();
  const nw = netWorth(accounts);
  const owner = (o: string) => (o === "shared" ? "Shared" : state.members.find((m) => m.id === o)?.name ?? "—");
  const list = (debt: boolean) => (
    <ul className="divide-y text-sm">
      {accounts.filter((a) => DEBT_ACCOUNT_TYPES.includes(a.type) === debt).map((a) => (
        <li key={a.id} className="flex justify-between py-2.5">
          <span>{a.name}<span className="block text-xs text-muted-foreground">{ACCOUNT_TYPE_LABEL[a.type]} · {owner(a.owner)}</span></span>
          <span className="tabular">{fmt(a.balance)}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <PageHeader eyebrow="Everything you own and owe" title="Net worth" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Net worth" value={fmt(nw.net)} tone={nw.net >= 0 ? "positive" : "negative"} />
        <Stat label="Savings & investments" value={fmt(nw.savings)} tone="lavender" />
        <Stat label="Total assets" value={fmt(nw.assets)} />
        <Stat label="Total debts" value={fmt(nw.debts)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Assets">{list(false)}</Panel>
        <Panel title="Debts">{list(true)}</Panel>
      </div>
    </div>
  );
}
