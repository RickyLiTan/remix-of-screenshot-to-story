import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed, seedAccounts, uid } from "./seed";
import { monthOf, shiftMonth, txInMonth } from "./calc";
import type { Account, Category, FinanceState, Goal, IncomeRecord, Member, Month, Transaction, Visibility } from "./types";

const KEY = "common-ground-demo-v1";

export const currentMonth = (): Month => new Date().toISOString().slice(0, 7);

interface Ctx {
  state: FinanceState;
  month: Month;
  setMonth: (m: Month) => void;
  saveTransaction: (t: Omit<Transaction, "id" | "createdAt"> & { id?: string | undefined }) => void;
  deleteTransaction: (id: string) => void;
  addIncome: (r: Omit<IncomeRecord, "id" | "createdAt">) => void;
  setBudget: (categoryId: string, month: Month, amount: number) => void;
  addCategory: (c: Omit<Category, "id">) => string;
  saveGoal: (g: Omit<Goal, "id" | "createdAt"> & { id?: string }) => void;
  deleteGoal: (id: string) => void;
  linkToGoal: (txId: string, goalId: string) => void;
  setVisibility: (v: Visibility) => void;
  setViewer: (id: string) => void;
  updateMember: (id: string, patch: Partial<Omit<Member, "id">>) => void;
  saveAccount: (a: Omit<Account, "id" | "updatedAt"> & { id?: string }) => void;
  deleteAccount: (id: string) => void;
  resetDemo: () => void;
}

const FinanceContext = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState | null>(null);
  const [month, setMonth] = useState<Month>("");

  useEffect(() => {
    const cm = currentMonth();
    setMonth(cm);
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? JSON.parse(raw) : buildSeed(cm));
    } catch {
      setState(buildSeed(cm));
    }
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((fn: (s: FinanceState) => FinanceState) => setState((s) => (s ? fn(s) : s)), []);
  const now = () => new Date().toISOString();

  const api = useMemo<Omit<Ctx, "state" | "month" | "setMonth">>(
    () => ({
      saveTransaction: (t) =>
        update((s) => {
          if (t.id) return { ...s, transactions: s.transactions.map((x) => (x.id === t.id ? { ...x, ...t } as Transaction : x)) };
          return { ...s, transactions: [...s.transactions, { ...t, id: uid("tx"), createdAt: now() } as Transaction] };
        }),
      deleteTransaction: (id) => update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })),
      addIncome: (r) => update((s) => ({
        ...s,
        incomes: [
          ...s.incomes.filter((i) => !(i.memberId === r.memberId && i.month === r.month && (i.frequency ?? "fixed") === (r.frequency ?? "fixed"))),
          { ...r, id: uid("inc"), createdAt: now() },
        ],
      })),
      setBudget: (categoryId, m, amount) =>
        update((s) => ({
          ...s,
          budgets: [...s.budgets.filter((b) => !(b.categoryId === categoryId && b.month === m)), { id: uid("bud"), categoryId, month: m, amount, createdAt: now() }],
        })),
      addCategory: (c) => {
        const id = uid("cat");
        update((s) => ({ ...s, categories: [...s.categories, { ...c, id, custom: true }] }));
        return id;
      },
      saveGoal: (g) =>
        update((s) => {
          if (g.id) return { ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, ...g } as Goal : x)) };
          return { ...s, goals: [...s.goals, { ...g, id: uid("goal"), createdAt: now() } as Goal] };
        }),
      deleteGoal: (id) =>
        update((s) => ({
          ...s,
          goals: s.goals.filter((g) => g.id !== id),
          transactions: s.transactions.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        })),
      linkToGoal: (txId, goalId) => update((s) => ({ ...s, transactions: s.transactions.map((t) => (t.id === txId ? { ...t, goalId } : t)) })),
      setVisibility: (visibility) => update((s) => ({ ...s, visibility })),
      setViewer: (viewerId) => update((s) => ({ ...s, viewerId })),
      updateMember: (id, patch) => update((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      saveAccount: (a) =>
        update((s) => {
          const list = s.accounts ?? seedAccounts();
          const rec = { ...a, updatedAt: now() } as Account;
          if (a.id) return { ...s, accounts: list.map((x) => (x.id === a.id ? { ...x, ...rec } : x)) };
          return { ...s, accounts: [...list, { ...rec, id: uid("acct") }] };
        }),
      deleteAccount: (id) => update((s) => ({ ...s, accounts: (s.accounts ?? seedAccounts()).filter((a) => a.id !== id) })),
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState(buildSeed(currentMonth()));
      },
    }),
    [update],
  );

  if (!state || !month)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading household…</p>
        </div>
      </div>
    );

  return <FinanceContext.Provider value={{ state, month, setMonth, ...api }}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const c = useContext(FinanceContext);
  if (!c) throw new Error("useFinance must be inside FinanceProvider");
  return c;
}

/** Recurring household bills from last month not yet recorded this month. */
export function upcomingBills(state: FinanceState, month: Month) {
  const prev = txInMonth(state.transactions, shiftMonth(month, -1)).filter((t) => t.recurring && t.scope === "household");
  const cur = txInMonth(state.transactions, month);
  return prev
    .filter((p) => !cur.some((c) => c.description === p.description))
    .map((p) => ({ ...p, dueDate: `${month}-${p.date.slice(8, 10)}` }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export { monthOf };
