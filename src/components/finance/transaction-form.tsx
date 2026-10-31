import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useFinance } from "@/lib/finance/store";
import { GROUP_LABEL, TX_TYPE_LABEL, type CategoryGroup, type Scope, type Transaction, type TxType } from "@/lib/finance/types";
import { toast } from "sonner";

export const selectCls = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Draft = Partial<Transaction>;

export function TransactionDialog({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Draft }) {
  const { state, month, saveTransaction } = useFinance();
  const blank = (): Draft => ({
    description: "",
    amount: undefined,
    date: `${month}-${String(Math.min(new Date().getDate(), 28)).padStart(2, "0")}`,
    type: "expense",
    scope: "household",
    memberId: state.viewerId,
    categoryId: null,
    recurring: false,
    goalId: null,
    notes: "",
  });
  const [d, setD] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setD({ ...blank(), ...initial });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const isTransfer = d.type === "household_contribution" || d.type === "personal_allocation" || d.type === "income";
  const groups: CategoryGroup[] = d.scope === "personal" ? ["personal"] : ["fixed", "variable", "debt", "savings"];
  const goals = state.goals.filter((g) => (d.type === "debt_repayment" ? g.kind === "payoff" : d.type === "savings_contribution" ? g.kind === "savings" : true));

  function submit() {
    const e: Record<string, string> = {};
    if (!d.description?.trim()) e.description = "Add a description";
    if (!d.amount || d.amount <= 0 || !Number.isFinite(d.amount)) e.amount = "Enter an amount above $0";
    if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) e.date = "Pick a date";
    if (!isTransfer && !d.categoryId) e.categoryId = "Choose a category";
    setErrors(e);
    if (Object.keys(e).length) return;
    saveTransaction({
      id: d.id,
      description: d.description!.trim(),
      amount: Math.round(d.amount! * 100) / 100,
      date: d.date!,
      type: d.type as TxType,
      scope: isTransfer ? "household" : (d.scope as Scope),
      memberId: d.memberId!,
      categoryId: isTransfer ? null : d.categoryId!,
      goalId: d.goalId || null,
      recurring: !!d.recurring,
      notes: d.notes?.trim() || undefined,
    });
    toast.success(d.id ? "Transaction updated" : "Transaction added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">{d.id ? "Edit transaction" : "New transaction"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Description" error={errors.description}>
            <Input value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Weekly groceries" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (CAD)" error={errors.amount}>
              <Input type="number" min="0" step="0.01" value={d.amount ?? ""} onChange={(e) => set("amount", e.target.value === "" ? undefined : Number(e.target.value))} />
            </Field>
            <Field label="Date" error={errors.date}>
              <Input type="date" value={d.date ?? ""} onChange={(e) => set("date", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className={selectCls} value={d.type} onChange={(e) => set("type", e.target.value as TxType)}>
                {Object.entries(TX_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Member">
              <select className={selectCls} value={d.memberId} onChange={(e) => set("memberId", e.target.value)}>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
          </div>
          {isTransfer ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Transfers and income are tracked separately and never counted as spending.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Designation">
                  <select className={selectCls} value={d.scope} onChange={(e) => setD((p) => ({ ...p, scope: e.target.value as Scope, categoryId: null }))}>
                    <option value="household">Household</option>
                    <option value="personal">Personal</option>
                  </select>
                </Field>
                <Field label="Category" error={errors.categoryId}>
                  <select className={selectCls} value={d.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
                    <option value="">Select…</option>
                    {groups.map((g) => (
                      <optgroup key={g} label={GROUP_LABEL[g]}>
                        {state.categories.filter((c) => c.group === g).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Linked goal (optional)">
                <select className={selectCls} value={d.goalId ?? ""} onChange={(e) => set("goalId", e.target.value || null)}>
                  <option value="">None</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field label="Notes (optional)">
            <Textarea rows={2} value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
          <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            Recurring every month
            <Switch checked={!!d.recurring} onCheckedChange={(v) => set("recurring", v)} />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit}>{d.id ? "Save changes" : "Add transaction"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
