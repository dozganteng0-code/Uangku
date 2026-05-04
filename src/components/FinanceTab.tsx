import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, TrendingUp, TrendingDown, RefreshCw, Calendar, 
  Search, SlidersHorizontal, Edit2, Edit3, Trash2, ArrowUpRight, 
  ArrowDownRight, ChevronDown, ChevronUp, ChevronRight, Image as ImageIcon,
  Tag, CalendarDays, Filter, StickyNote, Wallet, PieChart
} from 'lucide-react';
import { FinanceRecord } from '../types';
import { parseCategory, isIncomeItem, isExpenseItem, formatCurrency, getDefaultCategory, getCategoryDisplayName } from '../lib/utils';

export const FinanceTab = ({
  loading = false,
  workerUrl,
  connectionStatus,
  financeRecords,
  setFinanceRecords,
  financeCategories,
  fetchFinance,
  showToast,
  openDeleteConfirm,
  deleteFinance,
  collapsedMonths,
  setCollapsedMonths,
  collapsedCategories,
  setCollapsedCategories
}: {
  loading?: boolean;
  workerUrl: string;
  connectionStatus: string;
  financeRecords: FinanceRecord[];
  setFinanceRecords: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  financeCategories: string[];
  fetchFinance: () => void;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
  openDeleteConfirm: (type: 'record'|'category', id: string, label: string) => void;
  deleteFinance: (id: string) => void;
  collapsedMonths: string[];
  setCollapsedMonths: React.Dispatch<React.SetStateAction<string[]>>;
  collapsedCategories: string[];
  setCollapsedCategories: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
  );
  const [newFinance, setNewFinance] = useState(() => {
    const savedType = localStorage.getItem("last_transaction_type");
    const initType = (savedType === "income" || savedType === "expense" ? savedType : "expense") as "income" | "expense";
    return {
      type: initType,
      amount: "",
      description: "",
      category: getDefaultCategory(initType, financeCategories),
      date: new Date().toISOString().split("T")[0],
    };
  });
  const [editingFinanceId, setEditingFinanceId] = useState<string | null>(null);
  const [editFinance, setEditFinance] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    description: "",
    category: "Umum",
    date: new Date().toISOString().split("T")[0],
  });
  const addDescRef = useRef<HTMLTextAreaElement>(null);
  const editDescRef = useRef<HTMLTextAreaElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [financeViewMode, setFinanceViewMode] = useState<
    "all" | "income" | "expense"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [descriptionMode, setDescriptionMode] = useState<
    "none" | "bullet" | "dash" | "square"
  >("none");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<{
    month: number;
    year: number;
  } | null>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  // Advanced filters
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: "date" | "amount" | "category";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const itemsPerPage = 30;

  const handleDescriptionChange = useCallback((
    e: React.ChangeEvent<HTMLTextAreaElement>,
    isEdit: boolean
  ) => {
    let newVal = e.target.value;
    const target = e.target;
    let newCursorPos = target.selectionStart;

    const oldVal = isEdit ? editFinance.description : newFinance.description;

    if (descriptionMode !== "none") {
      const symbols = { bullet: "• ", dash: "- ", square: "▪ " };
      const symbol = symbols[descriptionMode];

      if (
        newVal.length > oldVal.length &&
        newVal[newCursorPos - 1] === "\n" &&
        oldVal.length + 1 === newVal.length
      ) {
        const lastLine = oldVal.substring(0, newCursorPos - 1).split("\n").pop() || "";

        if (lastLine === symbol) {
          newVal = oldVal.substring(0, newCursorPos - 1 - symbol.length) + oldVal.substring(newCursorPos - 1);
          newCursorPos = newCursorPos - 1 - symbol.length;
          setDescriptionMode("none");
        } else if (lastLine.startsWith(symbol)) {
          newVal = newVal.substring(0, newCursorPos) + symbol + newVal.substring(newCursorPos);
          newCursorPos += symbol.length;
        }
      }
    }

    if (isEdit) {
      setEditFinance((prev) => ({ ...prev, description: newVal }));
    } else {
      setNewFinance((prev) => ({ ...prev, description: newVal }));
    }

    if (newCursorPos !== target.selectionStart) {
      setTimeout(() => {
        target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  }, [editFinance.description, newFinance.description, descriptionMode]);

  const insertListStyle = useCallback((
    type: "bullet" | "dash" | "square",
    isEdit: boolean = false,
  ) => {
    const symbol = type === "bullet" ? "• " : type === "dash" ? "- " : "▪ ";
    const ref = isEdit ? editDescRef : addDescRef;

    if (ref.current) {
      const textarea = ref.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);

      const newText =
        before +
        (before.endsWith("\n") || before === "" ? "" : "\n") +
        symbol +
        after;

      if (isEdit) {
        setEditFinance((prev) => ({ ...prev, description: newText }));
      } else {
        setNewFinance((prev) => ({ ...prev, description: newText }));
      }

      // Need timeout to set focus and selection after state update
      setTimeout(() => {
        textarea.focus();
        const newPos =
          start +
          (before.endsWith("\n") || before === "" ? 0 : 1) +
          symbol.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  }, []);

  const addFinance = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!newFinance.amount) return;

    let actualCategory = newFinance.category;
    if (!financeCategories.includes(actualCategory)) {
      actualCategory = getDefaultCategory(newFinance.type === 'income' ? 'income' : 'expense', financeCategories) || actualCategory;
    }

    try {
      const payload = {
          ...newFinance,
          category: actualCategory,
          type: newFinance.type === 'income' ? 'income' : 'expense',
          amount: parseFloat(newFinance.amount),
        };
        console.log("Submitting record:", payload);
        const response = await fetch(`${workerUrl}/api/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchFinance();
        resetFinanceForm();
        showToast("Catatan berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Error adding finance record:", error);
    }
  }, [newFinance, financeCategories, workerUrl, fetchFinance, showToast]);

  const submitEditFinance = useCallback(async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editFinance.amount || !editingFinanceId) return;

    let actualCategory = editFinance.category;
    if (!financeCategories.includes(actualCategory)) {
      actualCategory = getDefaultCategory(editFinance.type === 'income' ? 'income' : 'expense', financeCategories) || actualCategory;
    }

    try {
        const payload = {
            ...editFinance,
            category: actualCategory,
            type: editFinance.type === 'income' ? 'income' : 'expense',
            amount: parseFloat(editFinance.amount),
            date: new Date().toISOString().split("T")[0],
            createdAt: Date.now(),
          };
          console.log("Updating record:", payload);
          const response = await fetch(
        `${workerUrl}/api/finance/${editingFinanceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        fetchFinance();
        setEditingFinanceId(null);
        showToast("Catatan berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error updating finance record:", error);
    }
  }, [editFinance, editingFinanceId, financeCategories, workerUrl, fetchFinance, showToast]);

  const resetFinanceForm = useCallback(() => {
    setNewFinance({
      type: "expense",
      amount: "",
      description: "",
      category: getDefaultCategory("expense", financeCategories),
      date: new Date().toISOString().split("T")[0],
    });
    setIsFormVisible(false);
  }, [financeCategories]);

  const startEditFinance = useCallback((record: FinanceRecord) => {
    setEditFinance({
      type: record.type,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      date: record.date,
    });
    setEditingFinanceId(record.id);
  }, []);

  const filteredRecords = React.useMemo(() => {
    let records = [...financeRecords];

    // View mode filter (all/income/expense)
    if (financeViewMode !== "all") {
      records = records.filter((r) => {
          if (financeViewMode === "income") return isIncomeItem(r.type, r.category);
          if (financeViewMode === "expense") return isExpenseItem(r.type, r.category);
          return true;
      });
    }

    // Category filter
    if (filterCategory !== "all") {
      records = records.filter((r) => r.category === filterCategory);
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.amount.toString().includes(q),
      );
    }

    // Date navigation filter (if expanded filters are NOT used)
    if (!filterStartDate && !filterEndDate) {
      if (selectedDateFilter) {
        records = records.filter((r) => {
          const d = new Date(r.date);
          return (
            d.getMonth() === selectedDateFilter.month &&
            d.getFullYear() === selectedDateFilter.year
          );
        });
      }
    } else {
      // Date range filter
      if (filterStartDate) {
        records = records.filter((r) => r.date >= filterStartDate);
      }
      if (filterEndDate) {
        records = records.filter((r) => r.date <= filterEndDate);
      }
    }

    return records.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortConfig.key === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortConfig.key === "category") {
        comparison = a.category.localeCompare(b.category);
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [
    financeRecords,
    financeViewMode,
    selectedDateFilter,
    filterStartDate,
    filterEndDate,
    filterCategory,
    searchQuery,
    sortConfig,
  ]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    financeViewMode,
    selectedDateFilter,
    filterStartDate,
    filterEndDate,
    filterCategory,
    searchQuery,
  ]);

  const paginatedRecords = React.useMemo(() => {
    return filteredRecords.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Derive stats for current filtered set
  const stats = React.useMemo(() => {
    const income = filteredRecords
      .filter((r) => isIncomeItem(r.type, r.category))
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = filteredRecords
      .filter((r) => isExpenseItem(r.type, r.category))
      .reduce((sum, r) => sum + r.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredRecords]);

  // Derive all available months from records
  const availableMonths = React.useMemo(() => {
    const monthsMap = new Map<
      string,
      { month: number; year: number; label: string }
    >();

    financeRecords.forEach((r) => {
      const d = new Date(r.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      const key = `${m}-${y}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: m,
          year: y,
          label: d.toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          }),
        });
      }
    });

    return Array.from(monthsMap.values()).sort(
      (a, b) => b.year * 12 + b.month - (a.year * 12 + a.month),
    );
  }, [financeRecords]);

  const getFullDateTime = useCallback((dateStr: string, timestamp: number) => {
    const d = new Date(dateStr);
    const time = new Date(timestamp);

    const day = time.toLocaleDateString("id-ID", { weekday: "long" });
    const date = time.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const hour = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hour.toString().padStart(2, "0")}:${minutes}`;

    let period = "";
    if (hour >= 5 && hour < 11) period = "Pagi";
    else if (hour >= 11 && hour < 15) period = "Siang";
    else if (hour >= 15 && hour < 19) period = "Sore";
    else period = "Malam";

    return `${day}, ${date} • ${timeStr} ${period}`;
  }, []);

  const categoryBreakdown = useMemo(() => {
    return Object.entries(
      filteredRecords.reduce((acc, r) => {
        const rawCat = r.category;
        const pc = parseCategory(rawCat);
        let catName = pc.name;
        
        if (!financeCategories.includes(rawCat)) {
          // If category not found, group as "Lainnya"
          catName = "Lainnya";
        }
        
        if (!acc[catName]) acc[catName] = 0;
        acc[catName] += isIncomeItem(r.type, r.category) ? r.amount : -r.amount;
        return acc;
      }, {} as Record<string, number>)
    );
  }, [filteredRecords, financeCategories]);

  // trendData removed
   // trendData removed


  return (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Add Button */}
                    <button
                      onClick={() => {
                        if (!workerUrl) {
                          showToast("Silakan masukkan URL Worker di Pengaturan!", "error");
                          return;
                        }
                        setIsFormVisible(true);
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 mb-6 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 group font-black uppercase tracking-widest text-xs"
                    >
                      <Plus size={18} />
                      CATAT TRANSAKSI
                    </button>

                    <AnimatePresence>
                      {isFormVisible && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormVisible(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                          />
                          
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md max-h-[90vh] overflow-y-auto noscrollbar drop-shadow-2xl z-10"
                          >
                            {/* Finance Form */}
                            <form
                              onSubmit={addFinance}
                              className="bg-white rounded-3xl p-5 md:p-6 shadow-xl relative"
                            >
                              {/* Close component */}
                              <button
                                type="button"
                                onClick={() => setIsFormVisible(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors z-20"
                              >
                                <X size={20} />
                              </button>
                              
                              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Tambah Transaksi Baru</h2>
                              
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                                      Tipe Transaksi
                                    </label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl">
                                      <button
                                        type="button"
                                      onClick={() => {
                                        setNewFinance({
                                          ...newFinance,
                                          type: "income",
                                          category: getDefaultCategory("income", financeCategories),
                                        });
                                        localStorage.setItem("last_transaction_type", "income");
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${isIncomeItem(newFinance.type, newFinance.category) ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                      <TrendingUp size={14} /> PEMASUKAN
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewFinance({
                                          ...newFinance,
                                          type: "expense",
                                          category: getDefaultCategory("expense", financeCategories),
                                        });
                                        localStorage.setItem("last_transaction_type", "expense");
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${isExpenseItem(newFinance.type, newFinance.category) ? "bg-white text-rose-500 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                      <TrendingDown size={14} /> PENGELUARAN
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                                      Jumlah (Rp)
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                                      value={newFinance.amount}
                                      onChange={(e) =>
                                        setNewFinance({
                                          ...newFinance,
                                          amount: e.target.value,
                                        })
                                      }
                                      required
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                                        Deskripsi
                                      </label>
                                      <div className="flex items-center gap-1.5 pb-1">
                                        <select
                                          value={descriptionMode}
                                          onChange={(e) => {
                                            const mode = e.target
                                              .value as typeof descriptionMode;
                                            setDescriptionMode(mode);
                                            if (mode !== "none") {
                                              insertListStyle(
                                                mode as
                                                  | "bullet"
                                                  | "dash"
                                                  | "square",
                                                false,
                                              );
                                            }
                                          }}
                                          className="px-2 py-1 text-[8px] font-black bg-slate-100 text-slate-500 rounded-lg border-none focus:ring-0 cursor-pointer uppercase"
                                        >
                                          <option value="none">Normal</option>
                                          <option value="bullet">Bulat</option>
                                          <option value="dash">Strip</option>
                                          <option value="square">Kotak</option>
                                        </select>
                                      </div>
                                    </div>
                                    <textarea
                                      ref={addDescRef}
                                      placeholder="Tulis detail transaksi secara rinci di sini..."
                                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none min-h-[80px] resize-none leading-relaxed"
                                      value={newFinance.description}
                                      onChange={(e) => handleDescriptionChange(e, false)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                                      Kategori
                                    </label>
                                    <select
                                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none appearance-none cursor-pointer"
                                      value={newFinance.category}
                                      onChange={(e) =>
                                        setNewFinance({
                                          ...newFinance,
                                          category: e.target.value,
                                        })
                                      }
                                    >
                                      {financeCategories
                                        .map(parseCategory)
                                        .filter(
                                          (cat) =>
                                            cat.type === "all" ||
                                            cat.type === newFinance.type,
                                        )
                                        .map((cat) => (
                                          <option
                                            key={cat.raw}
                                            value={cat.raw}
                                          >
                                            {cat.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                                      Tanggal
                                    </label>
                                    <input
                                      type="date"
                                      className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                                      value={newFinance.date}
                                      onChange={(e) =>
                                        setNewFinance({
                                          ...newFinance,
                                          date: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black text-[10px] tracking-widest shadow-md active:scale-95 flex items-center justify-center gap-3 uppercase transition-all"
                            >
                              Catat Transaksi
                            </button>
                          </form>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* New Filter & Navigation Section */}
                    <div className="space-y-4 mb-4">
                      {/* 1. Monthly Period Selector */}
                      {availableMonths.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Periode Laporan
                          </label>
                          <div className="flex items-center gap-2 overflow-x-auto noscrollbar pb-1">
                            <button
                              onClick={() => setSelectedDateFilter(null)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                selectedDateFilter === null
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              Semua
                            </button>
                            {availableMonths.map((m) => (
                              <button
                                key={`${m.month}-${m.year}`}
                                onClick={() =>
                                  setSelectedDateFilter({
                                    month: m.month,
                                    year: m.year,
                                  })
                                }
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                                  selectedDateFilter?.month === m.month &&
                                  selectedDateFilter?.year === m.year
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Monthly Stats Display (Relocated here) */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
                        {loading ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="flex-1 flex flex-col items-center border-r border-slate-100 pr-4">
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">Pemasukan</span>
                              <span className="text-sm font-black text-emerald-600">+{formatCurrency(stats.income)}</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">Pengeluaran</span>
                              <span className="text-sm font-black text-rose-500">-{formatCurrency(stats.expense)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                    {/* Category Breakdown Summary with Toggle */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => {
                            if (collapsedCategories.includes("global")) {
                              setCollapsedCategories((prev) => prev.filter((m) => m !== "global"));
                            } else {
                              setCollapsedCategories((prev) => [...prev, "global"]);
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <PieChart size={12} className="text-slate-500" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                              Ringkasan Kategori
                            </span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform duration-300 ${collapsedCategories.includes("global") ? "" : "rotate-180"}`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {!collapsedCategories.includes("global") && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {categoryBreakdown.map(([cat, total]) => (
                                  <div
                                    key={cat}
                                    className="flex flex-col p-2 bg-white rounded-xl border border-slate-100 shadow-sm"
                                  >
                                    <span className="text-[7px] font-black text-slate-400 uppercase truncate mb-0.5">
                                      {cat}
                                    </span>
                                    <span
                                      className={`text-[10px] font-black ${(total as number) >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                                    >
                                      {(total as number) >= 0 ? "+" : ""} Rp {Math.abs(total as number).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 3. Transaction Type Grouping */}
                      <div className="flex items-center gap-2 overflow-x-auto noscrollbar">
                        {["all", "income", "expense"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setFinanceViewMode(mode as any)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                              financeViewMode === mode
                                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {mode === "all"
                              ? "Semua"
                              : mode === "income"
                                ? "Pemasukan"
                                : "Pengeluaran"}
                          </button>
                        ))}
                      </div>

                      {/* 3. Search Bar with Integrated Filter Icon (Below type toggles) */}
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-xs font-bold focus:bg-white focus:border-emerald-500 shadow-sm transition-all outline-none"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                              showFilters
                                ? "bg-slate-900 text-emerald-400"
                                : filterStartDate ||
                                    filterEndDate ||
                                    filterCategory !== "all"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            }`}
                            title="Filter Lanjutan"
                          >
                            <Filter size={16} />
                            {(filterStartDate ||
                              filterEndDate ||
                              filterCategory !== "all") &&
                              !showFilters && (
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white"></div>
                              )}
                          </button>
                        </div>
                      </div>

                      {/* Advanced Filter Panel */}
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  Pengaturan Filter & Sort
                                </h4>
                              </div>
                              
                              <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-500 mr-2">Sort:</span>
                                {["date", "amount", "category"].map((key) => (
                                  <button
                                    key={key}
                                    onClick={() =>
                                      setSortConfig((s) => ({
                                        key: key as any,
                                        direction:
                                          s.key === key && s.direction === "desc"
                                            ? "asc"
                                            : "desc",
                                      }))
                                    }
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      sortConfig.key === key
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                    {sortConfig.key === key &&
                                      (sortConfig.direction === "desc" ? (
                                        <ChevronDown size={12} />
                                      ) : (
                                        <ChevronUp size={12} />
                                      ))}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center justify-end">
                                <button
                                  onClick={() => {
                                    setFilterStartDate("");
                                    setFilterEndDate("");
                                    setFilterCategory("all");
                                  }}
                                  className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                  Reset
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    Rentang Tanggal
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <Calendar
                                        size={12}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                      />
                                      <input
                                        type="date"
                                        value={filterStartDate}
                                        onChange={(e) =>
                                          setFilterStartDate(e.target.value)
                                        }
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                      />
                                    </div>
                                    <span className="text-slate-300 text-[10px] font-bold">
                                      sd
                                    </span>
                                    <div className="relative flex-1">
                                      <Calendar
                                        size={12}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                      />
                                      <input
                                        type="date"
                                        value={filterEndDate}
                                        onChange={(e) =>
                                          setFilterEndDate(e.target.value)
                                        }
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    Kategori
                                  </label>
                                  <div className="relative">
                                    <Tag
                                      size={12}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                    <select
                                      value={filterCategory}
                                      onChange={(e) =>
                                        setFilterCategory(e.target.value)
                                      }
                                      className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-8 pr-4 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                      <option value="all">
                                        Semua Kategori
                                      </option>
                                      {financeCategories.map((cat) => {
                                        const parts = cat.split("::");
                                        const name =
                                          parts.length > 1
                                            ? parts[1]
                                            : parts[0];
                                        const type =
                                          parts.length > 1 ? parts[0] : "";
                                        return (
                                          <option key={cat} value={name}>
                                            {name}{" "}
                                            {type &&
                                              `(${type === "income" ? "Masuk" : "Keluar"})`}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <ChevronDown
                                      size={14}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Finance List Grouped by Month */}
                    <div className="space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                              </div>
                              <div className="p-4 space-y-3">
                                {[1, 2].map((j) => (
                                  <div key={j} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Skeleton className="h-10 w-10 rounded-xl" />
                                      <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-2 w-16" />
                                      </div>
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : Object.entries(
                        paginatedRecords.reduce(
                          (acc, r) => {
                            const month = new Date(r.date).toLocaleDateString(
                              "id-ID",
                              { month: "long", year: "numeric" },
                            );
                            if (!acc[month]) acc[month] = [];
                            acc[month].push(r);
                            return acc;
                          },
                          {} as Record<string, FinanceRecord[]>,
                        ),
                      )
                        .sort((a, b) => {
                          // Sort months descending
                          const dateA = new Date(
                            (a[1] as FinanceRecord[])[0].date,
                          );
                          const dateB = new Date(
                            (b[1] as FinanceRecord[])[0].date,
                          );
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map(([month, records]) => {
                          const isCollapsed = collapsedMonths.includes(month);
                          const canToggle = selectedDateFilter === null;

                          return (
                            <div
                              key={month}
                              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                            >
                              <button
                                disabled={!canToggle}
                                onClick={() => {
                                  if (isCollapsed) {
                                    setCollapsedMonths((prev) =>
                                      prev.filter((m) => m !== month),
                                    );
                                  } else {
                                    setCollapsedMonths((prev) => [
                                      ...prev,
                                      month,
                                    ]);
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-4 border-b border-slate-50 transition-colors ${canToggle ? "hover:bg-slate-50" : ""}`}
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays
                                      size={14}
                                      className="text-slate-400"
                                    />
                                    <h2 className="text-xs font-black uppercase tracking-[0.1em] text-slate-700">
                                      {month}
                                    </h2>
                                  </div>
                                </div>
                                {canToggle && (
                                  <div className="text-slate-300">
                                    <ChevronDown
                                      size={18}
                                      className={`transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
                                    />
                                  </div>
                                )}
                              </button>

                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-0 flex flex-col">
                                      <div className="divide-y divide-slate-100 mt-0">
                                        {(records as FinanceRecord[])
                                          .sort(
                                            (a, b) =>
                                              new Date(b.date).getTime() -
                                              new Date(a.date).getTime(),
                                          )
                                          .map((record) => (
                                            <div
                                              key={record.id}
                                              className="relative overflow-hidden group transition-all"
                                            >
                                              {/* Delete Action Background (Swipe Target) */}
                                              <div className="absolute inset-0 bg-rose-500 flex items-center justify-end px-6 pointer-events-none">
                                                <div className="flex flex-col items-center gap-1 text-white">
                                                  <Trash2 size={20} className="animate-pulse" />
                                                  <span className="text-[8px] font-black uppercase tracking-tighter">Hapus</span>
                                                </div>
                                              </div>

                                              {/* Main Record Content (Draggable) */}
                                              <motion.div
                                                drag="x"
                                                dragConstraints={{ left: -100, right: 0 }}
                                                dragElastic={0.1}
                                                onDragEnd={(_e, info) => {
                                                  // If dragged significantly to the left (more than -70px)
                                                  if (info.offset.x < -70) {
                                                    deleteFinance(record.id);
                                                  }
                                                }}
                                                className="relative bg-white z-10 flex flex-col gap-0 group-hover:bg-slate-50/80 transition-color cursor-pointer"
                                                onClick={() =>
                                                  setExpandedId(
                                                    expandedId === record.id
                                                      ? null
                                                      : record.id,
                                                  )
                                                }
                                              >
                                                <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                                                <div className="flex flex-row items-center gap-2.5 overflow-hidden">
                                                  <div
                                                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${isIncomeItem(record.type, record.category) ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                                                  >
                                                    {isIncomeItem(record.type, record.category) ? (
                                                      <TrendingUp size={14} />
                                                    ) : (
                                                      <TrendingDown size={14} />
                                                    )}
                                                  </div>
                                                  <div className="flex flex-col min-w-0 pr-1">
                                                    <h4
                                                      className={`text-[13px] font-black truncate leading-tight ${isIncomeItem(record.type, record.category) ? "text-emerald-600" : "text-rose-500"}`}
                                                    >
                                                      {isIncomeItem(record.type, record.category)
                                                        ? "+"
                                                        : "-"}{" "}
                                                      Rp{" "}
                                                      {Math.abs(record.amount).toLocaleString(
                                                        "id-ID",
                                                      )}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-[1px] overflow-hidden">
                                                      <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-500">
                                                        {getCategoryDisplayName(record.category, financeCategories)}
                                                      </span>
                                                      <span className="text-slate-300 text-[7px]">
                                                        •
                                                      </span>
                                                      <span className="text-[7.5px] font-bold text-slate-400">
                                                        {new Date(
                                                          record.date,
                                                        ).toLocaleDateString(
                                                          "id-ID",
                                                          {
                                                            day: "numeric",
                                                            month: "short",
                                                          },
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (
                                                        editingFinanceId ===
                                                        record.id
                                                      ) {
                                                        setEditingFinanceId(
                                                          null,
                                                        );
                                                      } else {
                                                        startEditFinance(
                                                          record,
                                                        );
                                                      }
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-all ${
                                                      editingFinanceId ===
                                                      record.id
                                                        ? "text-rose-500 bg-rose-50"
                                                        : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                                                    }`}
                                                  >
                                                    {editingFinanceId ===
                                                    record.id ? (
                                                      <X size={12} />
                                                    ) : (
                                                      <Edit3 size={12} />
                                                    )}
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openDeleteConfirm(
                                                        "record",
                                                        record.id,
                                                        record.description,
                                                      );
                                                    }}
                                                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                </div>
                                              </div>
                                            </motion.div>

                                            {editingFinanceId ===
                                            record.id ? (
                                                <motion.div
                                                  initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                  }}
                                                  animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                  }}
                                                  className="pt-4 border-t border-slate-100 overflow-hidden"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                      <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                          <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                            Jumlah (Rp)
                                                          </label>
                                                          <input
                                                            type="number"
                                                            value={
                                                              editFinance.amount
                                                            }
                                                            onChange={(e) =>
                                                              setEditFinance({
                                                                ...editFinance,
                                                                amount:
                                                                  e.target
                                                                    .value,
                                                              })
                                                            }
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                                                          />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                          <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                            Kategori
                                                          </label>
                                                          <select
                                                            value={
                                                              editFinance.category
                                                            }
                                                            onChange={(e) =>
                                                              setEditFinance({
                                                                ...editFinance,
                                                                category:
                                                                  e.target
                                                                    .value,
                                                              })
                                                            }
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                                                          >
                                                            {financeCategories
                                                              .map(
                                                                parseCategory,
                                                              )
                                                              .filter(
                                                                (cat) =>
                                                                  cat.type ===
                                                                    "all" ||
                                                                  cat.type ===
                                                                    editFinance.type,
                                                              )
                                                              .map((cat) => (
                                                                <option
                                                                  key={cat.raw}
                                                                  value={
                                                                    cat.raw
                                                                  }
                                                                >
                                                                  {cat.name}
                                                                </option>
                                                              ))}
                                                          </select>
                                                        </div>
                                                      </div>

                                                      <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                          <label className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                            Keterangan
                                                          </label>
                                                          <select
                                                            value={
                                                              descriptionMode
                                                            }
                                                            onChange={(e) => {
                                                              const mode = e
                                                                .target
                                                                .value as typeof descriptionMode;
                                                              setDescriptionMode(
                                                                mode,
                                                              );
                                                              if (
                                                                mode !== "none"
                                                              ) {
                                                                insertListStyle(
                                                                  mode as
                                                                    | "bullet"
                                                                    | "dash"
                                                                    | "square",
                                                                  true,
                                                                );
                                                              }
                                                            }}
                                                            className="px-1.5 py-0.5 text-[7px] font-black bg-white border border-slate-200 text-slate-400 rounded-md hover:border-emerald-300 hover:text-emerald-600 transition-all uppercase outline-none focus:ring-0 cursor-pointer"
                                                          >
                                                            <option value="none">
                                                              Normal
                                                            </option>
                                                            <option value="bullet">
                                                              Bulat
                                                            </option>
                                                            <option value="dash">
                                                              Strip
                                                            </option>
                                                            <option value="square">
                                                              Kotak
                                                            </option>
                                                          </select>
                                                        </div>
                                                        <textarea
                                                          ref={editDescRef}
                                                          value={editFinance.description}
                                                          onChange={(e) => handleDescriptionChange(e, true)}
                                                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[80px] resize-none"
                                                        />
                                                      </div>
                                                    </div>

                                                    <button
                                                      onClick={
                                                        submitEditFinance
                                                      }
                                                      disabled={isRefreshing}
                                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                      Simpan Perubahan
                                                    </button>
                                                  </div>
                                                </motion.div>
                                              ) : (
                                                expandedId === record.id && (
                                                  <motion.div
                                                    initial={{
                                                      height: 0,
                                                      opacity: 0,
                                                    }}
                                                    animate={{
                                                      height: "auto",
                                                      opacity: 1,
                                                    }}
                                                    className="pt-4 border-t border-slate-100 overflow-hidden"
                                                  >
                                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                                      <div className="flex items-center gap-2">
                                                        <StickyNote
                                                          size={12}
                                                          className="text-slate-400"
                                                        />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                          Detail Lengkap
                                                        </span>
                                                      </div>
                                                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                        {record.description || (
                                                          <span className="italic text-slate-400">
                                                            Tidak ada deskripsi
                                                          </span>
                                                        )}
                                                      </p>
                                                      <div className="grid grid-cols-2 gap-4 pt-2">
                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                          <p className="text-[7px] font-black text-slate-400 uppercase mb-1">
                                                            Kategori
                                                          </p>
                                                          <p className="text-[10px] font-bold text-slate-900">
                                                            {getCategoryDisplayName(record.category, financeCategories)}
                                                          </p>
                                                        </div>
                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                          <p className="text-[7px] font-black text-slate-400 uppercase mb-1">
                                                            ID Transaksi
                                                          </p>
                                                          <p className="text-[10px] font-mono text-slate-500 truncate">
                                                            {record.id}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </motion.div>
                                                )
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      {financeRecords.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl">
                          <Wallet size={48} className="text-slate-300 mb-4" />
                          <h4 className="text-slate-500 font-bold mb-1">
                            Belum ada transaksi tertulis.
                          </h4>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                            Silakan tambahkan data baru.
                          </p>
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            Sebelumnya
                          </button>
                          
                          <div className="flex items-center gap-1 overflow-x-auto px-2 noscrollbar">
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                                  currentPage === i + 1
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
  );
};
