export const parseCategory = (raw: string) => {
  if (raw.startsWith("income::"))
    return { raw, name: raw.substring(8), type: "income" as const };
  if (raw.startsWith("expense::"))
    return { raw, name: raw.substring(9), type: "expense" as const };
  return { raw, name: raw, type: "all" as const };
};

export const getCategoryDisplayName = (raw: string, financeCategories: string[]) => {
  const found = financeCategories.find(c => c === raw || c === `expense::${raw}` || c === `income::${raw}`);
  const parsed = parseCategory(raw);
  
  if (!found) {
      return `Lainnya`;
  }
  return parsed.name;
};

export const isIncomeItem = (type: any, category?: string) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "income" || t === "pemasukan") return true;
  if (typeof category === "string" && category.startsWith("income::")) return true;
  return false;
};

export const isExpenseItem = (type: any, category?: string) => {
  const t = String(type || "").toLowerCase().trim();
  if (t === "expense" || t === "pengeluaran") return true;
  if (typeof category === "string" && category.startsWith("expense::")) return true;
  return false;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getDefaultCategory = (type: "income" | "expense", categories: string[]) => {
  const allowed = categories.filter(c => {
    const pc = parseCategory(c);
    return pc.type === "all" || pc.type === type;
  });
  return allowed.length > 0 ? allowed[0] : "";
};
