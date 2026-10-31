export type MemberId = string;
export type Month = string; // YYYY-MM

export interface Member {
  id: MemberId;
  name: string;
  initials: string;
}

export interface IncomeRecord {
  id: string;
  memberId: MemberId;
  month: Month;
  amount: number; // take-home CAD
  householdPct: number; // 0-100, stored per record so history is preserved
  createdAt: string;
}

export type CategoryGroup = "fixed" | "variable" | "debt" | "savings" | "personal";

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  custom?: boolean;
}

export interface MonthlyBudget {
  id: string;
  categoryId: string;
  month: Month; // effective from this month onwards until a newer record
  amount: number;
  createdAt: string;
}

export type TxType =
  | "income"
  | "expense"
  | "household_contribution"
  | "personal_allocation"
  | "savings_contribution"
  | "debt_repayment";

export type Scope = "household" | "personal";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  categoryId: string | null;
  type: TxType;
  scope: Scope;
  memberId: MemberId;
  notes?: string | undefined;
  goalId?: string | null;
  recurring: boolean;
  createdAt: string;
}

export type GoalKind = "payoff" | "savings";
export type Priority = "high" | "medium" | "low";

export interface Goal {
  id: string;
  kind: GoalKind;
  name: string;
  targetAmount: number; // original owed (payoff) or target (savings)
  startingAmount: number; // already paid / saved before tracking began
  monthlyTarget: number;
  targetDate: string;
  priority: Priority;
  imageUrl?: string;
  createdAt: string;
}

export type Visibility = "shared" | "private" | "summary";

export interface FinanceState {
  members: Member[];
  incomes: IncomeRecord[];
  categories: Category[];
  budgets: MonthlyBudget[];
  transactions: Transaction[];
  goals: Goal[];
  visibility: Visibility;
  viewerId: MemberId;
}

export const TX_TYPE_LABEL: Record<TxType, string> = {
  income: "Income",
  expense: "Expense",
  household_contribution: "Household contribution",
  personal_allocation: "Personal allocation",
  savings_contribution: "Savings contribution",
  debt_repayment: "Debt repayment",
};

export const GROUP_LABEL: Record<CategoryGroup, string> = {
  fixed: "Fixed expenses",
  variable: "Variable expenses",
  debt: "Debt payments",
  savings: "Savings contributions",
  personal: "Personal",
};
