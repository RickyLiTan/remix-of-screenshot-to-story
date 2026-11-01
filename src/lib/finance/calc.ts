import type { FinanceState, Goal, IncomeRecord, Month, Transaction, TxType } from "./types";

/** Transaction types that are real outflows. Contributions & allocations are internal transfers. */
export const SPENDING_TYPES: TxType[] = ["expense", "savings_contribution", "debt_repayment"];

export const monthOf = (date: string): Month => date.slice(0, 7);

export function shiftMonth(m: Month, delta: number): Month {
  const [y = 0, mo = 1] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(m: Month, short = false): string {
  const [y = 0, mo = 1] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-CA", {
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
    timeZone: "UTC",
  });
}

export function splitIncome(amount: number, householdPct: number) {
  const household = Math.round(amount * householdPct) / 100;
  return { household, personal: Math.round((amount - household) * 100) / 100 };
}

/** Latest income record for a member effective at the given month. */
export function incomeFor(incomes: IncomeRecord[], memberId: string, month: Month) {
  return incomes
    .filter((i) => i.memberId === memberId && i.month <= month)
    .sort((a, b) => (a.month === b.month ? b.createdAt.localeCompare(a.createdAt) : b.month.localeCompare(a.month)))[0];
}

export function budgetFor(state: FinanceState, categoryId: string, month: Month): number {
  const rec = state.budgets
    .filter((b) => b.categoryId === categoryId && b.month <= month)
    .sort((a, b) => (a.month === b.month ? b.createdAt.localeCompare(a.createdAt) : b.month.localeCompare(a.month)))[0];
  return rec?.amount ?? 0;
}

export const txInMonth = (txs: Transaction[], month: Month) => txs.filter((t) => monthOf(t.date) === month);

export const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

export function householdSpending(txs: Transaction[], month: Month) {
  return sum(
    txInMonth(txs, month)
      .filter((t) => t.scope === "household" && SPENDING_TYPES.includes(t.type))
      .map((t) => t.amount),
  );
}

export function personalSpending(txs: Transaction[], memberId: string, month: Month) {
  return sum(
    txInMonth(txs, month)
      .filter((t) => t.scope === "personal" && t.memberId === memberId && SPENDING_TYPES.includes(t.type))
      .map((t) => t.amount),
  );
}

export function memberAllocation(state: FinanceState, memberId: string, month: Month) {
  const rec = incomeFor(state.incomes, memberId, month);
  if (!rec) return { income: 0, pct: 80, household: 0, personal: 0 };
  return { income: rec.amount, pct: rec.householdPct, ...splitIncome(rec.amount, rec.householdPct) };
}

export function recordedContribution(txs: Transaction[], memberId: string, month: Month) {
  return sum(
    txInMonth(txs, month)
      .filter((t) => t.type === "household_contribution" && t.memberId === memberId)
      .map((t) => t.amount),
  );
}

export function monthSummary(state: FinanceState, month: Month) {
  const members = state.members.map((m) => {
    const a = memberAllocation(state, m.id, month);
    const recorded = recordedContribution(state.transactions, m.id, month);
    const spent = personalSpending(state.transactions, m.id, month);
    return { member: m, ...a, recorded, spent, remainingPersonal: sum([a.personal, -spent]) };
  });
  const income = sum(members.map((m) => m.income));
  const household = sum(members.map((m) => m.household));
  const personal = sum(members.map((m) => m.personal));
  const expenses = householdSpending(state.transactions, month);
  return { members, income, household, personal, expenses, remaining: sum([household, -expenses]) };
}

export function goalProgress(goal: Goal, txs: Transaction[]) {
  const linked = txs.filter((t) => t.goalId === goal.id).sort((a, b) => a.date.localeCompare(b.date));
  const progress = sum([goal.startingAmount, ...linked.map((t) => t.amount)]);
  const remaining = Math.max(0, sum([goal.targetAmount, -progress]));
  const pct = goal.targetAmount > 0 ? Math.min(100, (progress / goal.targetAmount) * 100) : 0;
  return { history: linked, progress, remaining, pct };
}

/** Months from `fromMonth` until (and including) the target date's month; minimum 1. */
export function monthsUntil(fromMonth: Month, targetDate: string) {
  const [fy = 0, fm = 1] = fromMonth.split("-").map(Number);
  const [ty = 0, tm = 1] = targetDate.slice(0, 7).split("-").map(Number);
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

export function recommendedMonthly(remaining: number, fromMonth: Month, targetDate: string) {
  return Math.ceil((remaining / monthsUntil(fromMonth, targetDate)) * 100) / 100;
}

export function categorySpend(txs: Transaction[], categoryId: string, month: Month, scope: "household" | "personal" = "household") {
  return sum(
    txInMonth(txs, month)
      .filter((t) => t.categoryId === categoryId && t.scope === scope && SPENDING_TYPES.includes(t.type))
      .map((t) => t.amount),
  );
}

export const fmt = (n: number, cents = false) =>
  n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

export function netWorth(accounts: import("./types").Account[]) {
  const debtTypes = ["loan", "credit_card", "mortgage"];
  const assets = sum(accounts.filter((a) => !debtTypes.includes(a.type)).map((a) => a.balance));
  const debts = sum(accounts.filter((a) => debtTypes.includes(a.type)).map((a) => a.balance));
  const savings = sum(accounts.filter((a) => ["savings", "investment", "retirement"].includes(a.type)).map((a) => a.balance));
  return { assets, debts, savings, net: sum([assets, -debts]) };
}
