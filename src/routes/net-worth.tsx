import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance } from "@/lib/finance/store";
import { fmt, netWorth } from "@/lib/finance/calc";
import { seedAccounts } from "@/lib/finance/seed";
import { ACCOUNT_TYPE_LABEL, DEBT_ACCOUNT_TYPES, type Account, type AccountType } from "@/lib/finance/types";

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

type Draft = { id?: string; name: string; type: AccountType; balance: string; owner: string };

function NetWorthPage() {
  const { state, saveAccount, deleteAccount } = useFinance();
  const accounts = state.accounts ?? seedAccounts();
  const nw = netWorth(accounts);
  const [draft, setDraft] = useState<Draft | null>(null);
  const owner = (o: string) => (o === "shared" ? "Shared" : state.members.find((m) => m.id === o)?.name ?? "—");

  const edit = (a: Account) => setDraft({ id: a.id, name: a.name, type: a.type, balance: String(a.balance), owner: a.owner });
  const submit = () => {
    if (!draft || !draft.name.trim()) return;
    saveAccount({ ...(draft.id ? { id: draft.id } : {}), name: draft.name.trim(), type: draft.type, balance: Math.abs(Number(draft.balance) || 0), owner: draft.owner });
    setDraft(null);
  };

  const list = (debt: boolean) => {
    const items = accounts.filter((a) => DEBT_ACCOUNT_TYPES.includes(a.type) === debt);
    if (!items.length) return <p className="text-sm text-muted-foreground">Nothing here yet.</p>;
    return (
      <ul className="divide-y text-sm">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
            <span className="flex-1">{a.name}<span className="block text-xs text-muted-foreground">{ACCOUNT_TYPE_LABEL[a.type]} · {owner(a.owner)}</span></span>
            <span className="tabular">{fmt(a.balance)}</span>
            <Button variant="ghost" size="icon" aria-label={`Edit ${a.name}`} onClick={() => edit(a)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label={`Remove ${a.name}`} onClick={() => confirm(`Remove ${a.name}?`) && deleteAccount(a.id)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Everything you own and owe" title="Net worth">
        <Button onClick={() => setDraft({ name: "", type: "savings", balance: "", owner: "shared" })}><Plus className="mr-1 h-4 w-4" />Add account</Button>
      </PageHeader>
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

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Edit account" : "Add account"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="acct-name">Name</Label>
                <Input id="acct-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as AccountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACCOUNT_TYPE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label htmlFor="acct-bal">{DEBT_ACCOUNT_TYPES.includes(draft.type) ? "Amount owed" : "Balance"}</Label>
                <Input id="acct-bal" type="number" min="0" value={draft.balance} onChange={(e) => setDraft({ ...draft, balance: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Belongs to</Label>
                <Select value={draft.owner} onValueChange={(v) => setDraft({ ...draft, owner: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Shared</SelectItem>
                    {state.members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={submit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
