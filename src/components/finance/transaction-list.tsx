import { useMemo, useState } from "react";
import { Pencil, Repeat, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFinance } from "@/lib/finance/store";
import { fmt, SPENDING_TYPES } from "@/lib/finance/calc";
import { TX_TYPE_LABEL, type Transaction } from "@/lib/finance/types";
import { Empty, Pill } from "./ui";
import { TransactionDialog, selectCls } from "./transaction-form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function TransactionList({ items, filters = true, compact = false }: { items: Transaction[]; filters?: boolean; compact?: boolean }) {
  const { state, deleteTransaction } = useFinance();
  const [cat, setCat] = useState("");
  const [member, setMember] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const shown = useMemo(
    () =>
      items
        .filter((t) => (!cat || t.categoryId === cat) && (!member || t.memberId === member) && (!from || t.date >= from) && (!to || t.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [items, cat, member, from, to],
  );
  const usedCats = state.categories.filter((c) => items.some((t) => t.categoryId === c.id));
  const name = (id: string | null) => state.categories.find((c) => c.id === id)?.name ?? "Transfer";
  const mname = (id: string) => state.members.find((m) => m.id === id)?.name ?? "—";

  return (
    <div>
      {filters && (
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <select aria-label="Filter category" className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {usedCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Filter member" className={selectCls} value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="">Both members</option>
            {state.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}
      {shown.length === 0 ? (
        <Empty>No transactions match.</Empty>
      ) : (
        <ul className="divide-y">
          {shown.map((t) => {
            const isSpend = SPENDING_TYPES.includes(t.type);
            const goal = t.goalId ? state.goals.find((g) => g.id === t.goalId) : null;
            return (
              <li key={t.id} className="group flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{mname(t.memberId)[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {t.description}
                    {t.recurring && <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Recurring" />}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {t.date} · {name(t.categoryId)}
                    {!compact && !isSpend && <Pill tone="lavender">{TX_TYPE_LABEL[t.type]}</Pill>}
                    {!compact && goal && <Pill tone="positive">→ {goal.name}</Pill>}
                  </p>
                </div>
                <span className={`tabular text-sm ${isSpend ? "" : "text-positive"}`}>{isSpend ? "−" : "+"}{fmt(t.amount, true)}</span>
                {!compact && (
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                    <button aria-label="Edit" className="rounded p-1.5 hover:bg-muted" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button aria-label="Delete" className="rounded p-1.5 hover:bg-muted" onClick={() => setDeleting(t)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <TransactionDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} initial={editing ?? undefined} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.description}" for {deleting && fmt(deleting.amount, true)} will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deleteTransaction(deleting.id);
                toast.success("Transaction deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
