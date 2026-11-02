import { describe, expect, it } from "vitest";
import { incomeFor, splitIncome } from "./calc";
import type { IncomeRecord } from "./types";

const fixed: IncomeRecord = {
  id: "fixed", memberId: "partner", month: "2026-11", amount: 5000,
  householdPct: 80, frequency: "fixed", createdAt: "2026-11-02T17:00:00Z",
};
const monthly: IncomeRecord = {
  ...fixed, id: "monthly", amount: 6000, householdPct: 50,
  frequency: "month-only", createdAt: "2026-11-02T18:00:00Z",
};

describe("income frequency", () => {
  it("carries fixed monthly income forward without changing prior months", () => {
    expect(incomeFor([fixed], "partner", "2026-12")?.amount).toBe(5000);
    expect(incomeFor([fixed], "partner", "2026-10")).toBeUndefined();
  });
  it("applies a monthly override only to its month and restores the fixed split afterward", () => {
    const records = [fixed, monthly];
    const november = incomeFor(records, "partner", "2026-11");
    const december = incomeFor(records, "partner", "2026-12");
    expect(november?.amount).toBe(6000);
    expect(splitIncome(november?.amount ?? 0, november?.householdPct ?? 0).household).toBe(3000);
    expect(december?.amount).toBe(5000);
    expect(splitIncome(december?.amount ?? 0, december?.householdPct ?? 0).household).toBe(4000);
  });
  it("does not carry month-only income forward when there is no fixed income", () => {
    expect(incomeFor([monthly], "partner", "2026-11")?.amount).toBe(6000);
    expect(incomeFor([monthly], "partner", "2026-12")).toBeUndefined();
  });
  it("preserves recurring behavior of previously saved income", () => {
    const { frequency, ...legacy } = fixed;
    expect(incomeFor([legacy], "partner", "2026-12")?.amount).toBe(5000);
  });
  it("uses the last saved setting when timestamps are identical", () => {
    expect(incomeFor([fixed, { ...monthly, createdAt: fixed.createdAt }], "partner", "2026-11")?.amount).toBe(6000);
  });
});