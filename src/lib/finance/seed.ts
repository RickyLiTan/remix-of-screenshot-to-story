import { shiftMonth } from "./calc";
import type { Category, FinanceState, Month, Transaction } from "./types";

let n = 0;
export const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const cats: [string, string, Category["group"]][] = [
  ["rent", "Rent / mortgage", "fixed"],
  ["insurance", "Insurance", "fixed"],
  ["internet", "Internet", "fixed"],
  ["phone", "Phone", "fixed"],
  ["utilities", "Utilities", "fixed"],
  ["subs", "Subscriptions", "fixed"],
  ["groceries", "Groceries", "variable"],
  ["transport", "Transportation", "variable"],
  ["gas", "Gas", "variable"],
  ["supplies", "Household supplies", "variable"],
  ["restaurants", "Restaurants", "variable"],
  ["entertainment", "Entertainment", "variable"],
  ["shopping", "Shopping", "variable"],
  ["misc", "Miscellaneous", "variable"],
  ["car", "Car payments", "debt"],
  ["loans", "Loans", "debt"],
  ["cc", "Credit card payments", "debt"],
  ["s_travel", "Travel", "savings"],
  ["s_emergency", "Emergency fund", "savings"],
  ["s_future", "Future purchases", "savings"],
  ["s_other", "Other savings goals", "savings"],
  ["p_shopping", "Shopping", "personal"],
  ["p_beauty", "Beauty / grooming", "personal"],
  ["p_hobbies", "Hobbies", "personal"],
  ["p_restaurants", "Restaurants", "personal"],
  ["p_entertainment", "Entertainment", "personal"],
  ["p_travel", "Travel", "personal"],
  ["p_misc", "Miscellaneous", "personal"],
];

const budgets: Record<string, number> = {
  rent: 2400, insurance: 260, internet: 85, phone: 140, utilities: 210, subs: 60,
  groceries: 900, transport: 120, gas: 220, supplies: 120, restaurants: 300, entertainment: 150,
  shopping: 200, misc: 100, car: 520, loans: 300, cc: 200,
  s_travel: 400, s_emergency: 500, s_future: 250, s_other: 100,
};

/** Fictional dummy data covering the six months up to `current`. */
export function buildSeed(current: Month): FinanceState {
  const now = new Date().toISOString();
  const start = shiftMonth(current, -5);
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(start, i));
  const tx: Transaction[] = [];
  const add = (t: Omit<Transaction, "id" | "createdAt" | "recurring" | "scope"> & Partial<Transaction>) =>
    tx.push({ id: uid("tx"), createdAt: now, recurring: false, scope: "household", ...t } as Transaction);

  months.forEach((m, i) => {
    const d = (day: number) => `${m}-${String(day).padStart(2, "0")}`;
    const isCurrent = m === current;
    const wobble = (base: number, k: number) => Math.round(base * (0.85 + ((i * 7 + k * 3) % 10) / 30));
    add({ description: "Contribution — Alex", amount: 4000, date: d(1), categoryId: null, type: "household_contribution", memberId: "m_a" });
    if (!isCurrent || i % 2 === 0)
      add({ description: "Contribution — Sam", amount: 3200, date: d(2), categoryId: null, type: "household_contribution", memberId: "m_b" });
    add({ description: "Apartment rent", amount: 2400, date: d(1), categoryId: "rent", type: "expense", memberId: "m_a", recurring: true });
    add({ description: "Tenant & auto insurance", amount: 255, date: d(3), categoryId: "insurance", type: "expense", memberId: "m_b", recurring: true });
    add({ description: "Fibre internet", amount: 85, date: d(8), categoryId: "internet", type: "expense", memberId: "m_a", recurring: true });
    add({ description: "Phone plans", amount: 138, date: d(12), categoryId: "phone", type: "expense", memberId: "m_b", recurring: true });
    add({ description: "Streaming bundle", amount: 42, date: d(15), categoryId: "subs", type: "expense", memberId: "m_a", recurring: true });
    add({ description: "Car loan payment", amount: 520, date: d(5), categoryId: "car", type: "debt_repayment", memberId: "m_a", recurring: true, goalId: "g_car" });
    add({ description: "Emergency fund transfer", amount: 500, date: d(6), categoryId: "s_emergency", type: "savings_contribution", memberId: "m_b", recurring: true, goalId: "g_emergency" });
    add({ description: "Japan trip fund", amount: 400, date: d(6), categoryId: "s_travel", type: "savings_contribution", memberId: "m_a", recurring: true, goalId: "g_japan" });
    if (!isCurrent) {
      add({ description: "Hydro & gas", amount: wobble(200, 1), date: d(20), categoryId: "utilities", type: "expense", memberId: "m_a", recurring: true });
      add({ description: "Sofa installment", amount: 150, date: d(22), categoryId: "loans", type: "debt_repayment", memberId: "m_b", recurring: true, goalId: "g_sofa" });
    }
    const days = isCurrent ? [4, 11, 18] : [4, 11, 18, 25];
    days.forEach((day, k) => {
      add({ description: ["Superstore", "Farmers market", "No Frills", "Costco"][k] ?? "", amount: wobble(220, k), date: d(day), categoryId: "groceries", type: "expense", memberId: k % 2 ? "m_b" : "m_a" });
    });
    add({ description: "Gas station", amount: wobble(95, 2), date: d(9), categoryId: "gas", type: "expense", memberId: "m_b" });
    add({ description: "Dinner out", amount: wobble(110, 4), date: d(14), categoryId: "restaurants", type: "expense", memberId: "m_a" });
    add({ description: "Cleaning supplies", amount: wobble(60, 5), date: d(16), categoryId: "supplies", type: "expense", memberId: "m_b" });
    add({ description: "Transit passes", amount: 112, date: d(2), categoryId: "transport", type: "expense", memberId: "m_b", recurring: true });
    // personal
    add({ description: "Climbing gym", amount: 75, date: d(3), categoryId: "p_hobbies", type: "expense", scope: "personal", memberId: "m_a", recurring: true });
    add({ description: "New jacket", amount: wobble(140, 6), date: d(13), categoryId: "p_shopping", type: "expense", scope: "personal", memberId: "m_a" });
    add({ description: "Coffee with friends", amount: wobble(45, 7), date: d(17), categoryId: "p_restaurants", type: "expense", scope: "personal", memberId: "m_a" });
    add({ description: "Haircut", amount: 60, date: d(7), categoryId: "p_beauty", type: "expense", scope: "personal", memberId: "m_b" });
    add({ description: "Concert tickets", amount: wobble(120, 8), date: d(19), categoryId: "p_entertainment", type: "expense", scope: "personal", memberId: "m_b" });
    add({ description: "Pottery class", amount: 90, date: d(10), categoryId: "p_hobbies", type: "expense", scope: "personal", memberId: "m_b" });
  });

  return {
    members: [
      { id: "m_a", name: "Alex", initials: "A" },
      { id: "m_b", name: "Sam", initials: "S" },
    ],
    incomes: [
      { id: uid("inc"), memberId: "m_a", month: start, amount: 4800, householdPct: 80, createdAt: now },
      { id: uid("inc"), memberId: "m_a", month: shiftMonth(start, 3), amount: 5000, householdPct: 80, createdAt: now },
      { id: uid("inc"), memberId: "m_b", month: start, amount: 4000, householdPct: 80, createdAt: now },
    ],
    categories: cats.map(([id, name, group]) => ({ id, name, group })),
    budgets: Object.entries(budgets).map(([categoryId, amount]) => ({ id: uid("bud"), categoryId, amount, month: start, createdAt: now })),
    transactions: tx,
    goals: [
      { id: "g_car", kind: "payoff", name: "Car financing", targetAmount: 18000, startingAmount: 6200, monthlyTarget: 520, targetDate: `${shiftMonth(current, 22)}-01`, priority: "high", createdAt: now },
      { id: "g_sofa", kind: "payoff", name: "Living room sofa", targetAmount: 1800, startingAmount: 600, monthlyTarget: 150, targetDate: `${shiftMonth(current, 4)}-01`, priority: "low", createdAt: now },
      { id: "g_emergency", kind: "savings", name: "Emergency fund", targetAmount: 15000, startingAmount: 4500, monthlyTarget: 500, targetDate: `${shiftMonth(current, 18)}-01`, priority: "high", createdAt: now },
      { id: "g_japan", kind: "savings", name: "Japan, spring trip", targetAmount: 6500, startingAmount: 800, monthlyTarget: 400, targetDate: `${shiftMonth(current, 6)}-01`, priority: "medium", createdAt: now },
      { id: "g_home", kind: "savings", name: "Home down payment", targetAmount: 60000, startingAmount: 9000, monthlyTarget: 250, targetDate: `${shiftMonth(current, 48)}-01`, priority: "medium", createdAt: now },
    ],
    visibility: "summary",
    viewerId: "m_a",
  };
}
