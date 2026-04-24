/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Tag,
  Calendar,
  ChevronRight,
  Filter,
  StickyNote,
  ShoppingBag,
  Briefcase,
  Sparkles,
  ArrowRight,
  Clock,
  Edit3,
  X,
  MessageCircle,
  RefreshCw,
  Send,
  Wallet,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  PanelLeftClose,
  PanelLeft,
  List,
  Smile,
  Type,
  Download,
  CalendarDays,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Tags,
  Hash,
  ChevronLeft,
  FileDown,
  BarChart3,
  CalendarCheck,
  Settings,
  Globe,
  Activity,
  HardDrive,
  Square,
  Minus,
  LayoutGrid,
  AlertTriangle,
  Search,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  GripVertical,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import * as XLSX from "xlsx";
import { FinanceRecord } from "./types";

// Auto-detect if running on AI Studio and use the local mock server if needed
const DEFAULT_API_URL = "";

const parseCategory = (raw: string) => {
  if (raw.startsWith("income::"))
    return { raw, name: raw.substring(8), type: "income" as const };
  if (raw.startsWith("expense::"))
    return { raw, name: raw.substring(9), type: "expense" as const };
  return { raw, name: raw, type: "all" as const };
};

const getCategoryDisplayName = (raw: string, financeCategories: string[]) => {
  const found = financeCategories.find(c => c === raw || c === `expense::${raw}` || c === `income::${raw}`);
  const parsed = parseCategory(raw);
  
  if (!found) {
      return `Lainnya`;
  }
  return parsed.name;
};

const BudgetsTab = ({
  budgets,
  setBudgets,
  financeRecords,
  categories,
  trackedCategories,
  setTrackedCategories,
}: {
  budgets: Record<string, { amount: number; period: 'monthly' | 'yearly' }>;
  setBudgets: React.Dispatch<React.SetStateAction<Record<string, { amount: number; period: 'monthly' | 'yearly' }>>>;
  financeRecords: FinanceRecord[];
  categories: string[];
  trackedCategories: string[];
  setTrackedCategories: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const expenseCategories = categories
    .map(parseCategory)
    .filter((c) => c.type === "expense" || c.type === "all");

  const untrackedCategories = expenseCategories.filter(
    (c) => !trackedCategories.includes(c.raw),
  );

  const getSpent = (category: string, period: 'monthly' | 'yearly') => {
    const now = new Date();
    return financeRecords
      .filter((r) => {
        if (r.category !== category || r.type !== "expense") return false;
        const date = new Date(r.date);
        if (period === 'monthly') {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        } else {
          return date.getFullYear() === now.getFullYear();
        }
      })
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const handleBudgetChange = (category: string, field: 'amount' | 'period', value: string | 'monthly' | 'yearly') => {
    setBudgets((prev) => {
      const current = prev[category] || { amount: 0, period: 'monthly' };
      return { ...prev, [category]: { ...current, [field]: field === 'amount' ? parseFloat(value as string) || 0 : value } };
    });
  };

  const addTrackedCategory = (category: string) => {
    if (!trackedCategories.includes(category)) {
      setTrackedCategories((prev) => [...prev, category]);
      setBudgets(prev => ({...prev, [category]: { amount: 0, period: 'monthly' }}));
    }
  };

  const removeTrackedCategory = (category: string) => {
    setTrackedCategories((prev) => prev.filter((c) => c !== category));
    setBudgets((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-slate-800">Budgeting</h2>
      
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <label className="block mb-2 font-bold text-slate-700">Add Category to Budget</label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              addTrackedCategory(e.target.value);
              e.target.value = "";
            }
          }}
          className="w-full p-2 border rounded-xl"
        >
          <option value="">Select a category</option>
          {untrackedCategories.map((c) => (
            <option key={c.raw} value={c.raw}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {trackedCategories.map((raw) => {
          const category = expenseCategories.find((c) => c.raw === raw);
          if (!category) return null;
          
          const budget = budgets[category.raw] || { amount: 0, period: 'monthly' };
          const spent = getSpent(category.raw, budget.period);
          const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
          
          return (
            <div key={category.raw} className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-slate-700">{category.name}</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeTrackedCategory(category.raw)} className="text-xs text-rose-500 hover:text-rose-700">Remove</button>
                  <span className="text-xs text-rose-500">Rp {spent.toLocaleString()} / </span>
                  <input
                    type="number"
                    value={budget.amount === 0 ? "" : budget.amount}
                    onChange={(e) => handleBudgetChange(category.raw, 'amount', e.target.value)}
                    placeholder="Limit"
                    className="w-20 text-right p-1 border rounded text-xs"
                  />
                  <select
                    value={budget.period}
                    onChange={(e) => handleBudgetChange(category.raw, 'period', e.target.value as 'monthly' | 'yearly')}
                    className="text-xs border rounded p-1"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${percentage >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(0)}% used</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [workerUrl, setWorkerUrl] = useState(
    localStorage.getItem("worker_url") || DEFAULT_API_URL,
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [financeCategories, setFinanceCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("finance_categories");
    return saved
      ? JSON.parse(saved)
      : [
          "income::Gaji",
          "expense::Makanan",
          "expense::Rokok",
          "expense::Hiburan",
          "expense::Tagihan",
          "expense::Transportasi",
          "expense::Kesehatan",
          "expense::Belanja",
          "expense::Lainnya",
        ];
  });

  useEffect(() => {
    localStorage.setItem(
      "finance_categories",
      JSON.stringify(financeCategories),
    );
  }, [financeCategories]);
  const [newFinance, setNewFinance] = useState(() => {
    const savedType = localStorage.getItem("last_transaction_type");
    return {
      type: (savedType === "income" || savedType === "expense" ? savedType : "expense") as "income" | "expense",
      amount: "",
      description: "",
      category: "Makanan",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [financeViewMode, setFinanceViewMode] = useState<
    "all" | "income" | "expense"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebar_open", isSidebarOpen.toString());
  }, [isSidebarOpen]);

  const [descriptionMode, setDescriptionMode] = useState<
    "none" | "bullet" | "dash" | "square"
  >("none");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<string[]>(() => {
    const saved = localStorage.getItem("collapsed_months");
    return saved ? JSON.parse(saved) : [];
  });
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>(
    () => {
      const saved = localStorage.getItem("collapsed_categories");
      return saved ? JSON.parse(saved) : [];
    },
  );
  const [activeTab, setActiveTab] = useState<
    "finance" | "categories" | "reports" | "settings" | "budgets"
  >("finance");
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

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: "record" | "category" | null;
    id: string | null;
    label: string | null;
  }>({ show: false, type: null, id: null, label: null });
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const addDescRef = useRef<HTMLTextAreaElement>(null);
  const editDescRef = useRef<HTMLTextAreaElement>(null);
  const [budgets, setBudgets] = useState<Record<string, { amount: number; period: 'monthly' | 'yearly' }>>(() => {
    const saved = localStorage.getItem("finance_budgets");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("finance_budgets", JSON.stringify(budgets));
  }, [budgets]);

  const [trackedCategories, setTrackedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("finance_tracked_categories");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("finance_tracked_categories", JSON.stringify(trackedCategories));
  }, [trackedCategories]);


  const moveCategoryOrder = (
    raw: string,
    direction: "up" | "down",
    type: "income" | "expense",
  ) => {
    setFinanceCategories((prev) => {
      // Filter categories of the specific type to move within that set
      const targets = prev.filter(c => {
        const cat = parseCategory(c);
        return type === "income" ? cat.type === "income" : (cat.type === "expense" || cat.type === "all");
      });
      
      const idx = targets.findIndex((c) => c === raw);
      if (idx === -1) return prev;

      let targetIdx = -1;
      if (direction === "up") {
        targetIdx = idx - 1;
      } else {
        targetIdx = idx + 1;
      }

      if (targetIdx >= 0 && targetIdx < targets.length) {
        const newTargets = [...targets];
        const temp = newTargets[idx];
        newTargets[idx] = newTargets[targetIdx];
        newTargets[targetIdx] = temp;
        
        // Reconstruct the full list
        const result = [...prev];
        let j = 0;
        for (let i = 0; i < result.length; i++) {
          const cat = parseCategory(result[i]);
          const isMatch = type === "income" ? cat.type === "income" : (cat.type === "expense" || cat.type === "all");
          if (isMatch) {
            result[i] = newTargets[j++];
          }
        }
        
        localStorage.setItem("categoryOrder", JSON.stringify(result));
        return result;
      }
      return prev;
    });
  };

  const handleDescriptionChange = (
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
  };

  const insertListStyle = (
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
  };

  const [reportConfig, setReportConfig] = useState({
    rangeType: "all" as "all" | "monthly" | "yearly",
    selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    selectedYear: new Date().getFullYear(),
    selectedCategory: "all",
    selectedType: "all" as "all" | "income" | "expense",
  });

  useEffect(() => {
    fetchFinance();
    fetchFinanceCategories();

    // Load sidebar state
    const savedSidebar = localStorage.getItem("sidebar_open");
    if (savedSidebar !== null) {
      setIsSidebarOpen(savedSidebar === "true");
    }

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchFinance();
    }, 60000);
    return () => clearInterval(interval);
  }, [workerUrl]);

  useEffect(() => {
    localStorage.setItem("sidebar_open", String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem("collapsed_months", JSON.stringify(collapsedMonths));
  }, [collapsedMonths]);

  useEffect(() => {
    localStorage.setItem(
      "collapsed_categories",
      JSON.stringify(collapsedCategories),
    );
  }, [collapsedCategories]);

  const fetchFinanceCategories = async () => {
    if (!workerUrl) return;
    try {
      const res = await fetch(`${workerUrl}/api/finance-categories`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const savedOrderStr = localStorage.getItem("categoryOrder");
          if (savedOrderStr) {
            try {
              const savedOrder = JSON.parse(savedOrderStr) as string[];
              const sortedData = [...data].sort((a, b) => {
                let indexA = savedOrder.indexOf(a);
                let indexB = savedOrder.indexOf(b);
                if (indexA === -1) indexA = Number.MAX_SAFE_INTEGER;
                if (indexB === -1) indexB = Number.MAX_SAFE_INTEGER;
                return indexA - indexB;
              });
              setFinanceCategories(sortedData);
              // Clean up the order in localstorage
              localStorage.setItem("categoryOrder", JSON.stringify(sortedData));
            } catch (e) {
              setFinanceCategories(data);
            }
          } else {
            setFinanceCategories(data);
          }
        }
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("error");
      }
    } catch (err) {
      console.error("Error fetching finance categories:", err);
      setConnectionStatus("error");
    }
  };

  const addFinanceCategory = async (
    name: string,
    type: "income" | "expense",
  ) => {
    if (!name) return;
    const formattedName = `${type}::${name}`;
    if (
      financeCategories.some(
        (c) => parseCategory(c).name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      alert("Nama kategori sudah ada!");
      return;
    }

    // Optimistic UI updates
    setFinanceCategories((prev) => {
      const newArr = [...prev, formattedName];
      localStorage.setItem("categoryOrder", JSON.stringify(newArr));
      return newArr;
    });

    try {
      await fetch(`${workerUrl}/api/finance-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formattedName }),
      });
      showToast("Kategori berhasil ditambahkan!");
    } catch (err) {
      console.error("Error adding finance category:", err);
    }
  };

  const editFinanceCategory = async (oldRawName: string, newRealName: string) => {
    if (!newRealName) return;
    const oldCat = parseCategory(oldRawName);
    const formattedNewName = oldCat.type === "all" ? newRealName : `${oldCat.type}::${newRealName}`;
    
    if (oldRawName === formattedNewName) return;
    
    if (
      financeCategories.some(
        (c) => parseCategory(c).name.toLowerCase() === newRealName.toLowerCase() && c !== oldRawName,
      )
    ) {
      alert("Nama kategori sudah ada!");
      return;
    }

    // Optimistic UI updates for both categories and records
    setFinanceCategories((prev) => {
      const newArr = prev.map((c) => c === oldRawName ? formattedNewName : c);
      localStorage.setItem("categoryOrder", JSON.stringify(newArr));
      return newArr;
    });
    setFinanceRecords((prev) => 
      prev.map(r => r.category === oldRawName ? { ...r, category: formattedNewName } : r)
    );

    try {
      await fetch(
        `${workerUrl}/api/finance-categories/${encodeURIComponent(oldRawName)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newName: formattedNewName }),
        },
      );
      showToast("Kategori berhasil diubah!");
    } catch (err) {
      console.error("Error editing finance category:", err);
      showToast("Gagal mengubah kategori.");
      fetchFinanceCategories(); // Revert
      fetchFinance(); // Revert records
    }
  };

  const reorderCategories = (newTypeOrder: string[], type: "income" | "expense") => {
    setFinanceCategories(prev => {
      const result = [...prev];
      let j = 0;
      for (let i = 0; i < result.length; i++) {
        const cat = parseCategory(result[i]);
        if (cat.type === type || (type === "expense" && cat.type === "all")) {
          // Note: "all" is treated as expense in filters usually, or check specifically
          if (j < newTypeOrder.length) {
            result[i] = newTypeOrder[j++];
          }
        }
      }
      localStorage.setItem("categoryOrder", JSON.stringify(result));
      return result;
    });
  };

  const deleteFinanceCategory = async (rawName: string) => {
    // Optimistic UI updates
    setFinanceCategories((prev) => {
      const newArr = prev.filter((c) => c !== rawName);
      localStorage.setItem("categoryOrder", JSON.stringify(newArr));
      return newArr;
    });

    try {
      await fetch(
        `${workerUrl}/api/finance-categories/${encodeURIComponent(rawName)}`,
        {
          method: "DELETE",
        },
      );
      showToast("Kategori berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting finance category:", err);
    }
  };

  const fetchFinance = async () => {
    try {
      const res = await fetch(`${workerUrl}/api/finance`);
      if (res.ok) {
        const data = await res.json();
        setFinanceRecords(data);
      }
    } catch (err) {
      console.error("Error fetching finance:", err);
    }
  };

  const addFinance = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!newFinance.amount) return;

    try {
      const response = await fetch(`${workerUrl}/api/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newFinance,
          amount: parseFloat(newFinance.amount),
        }),
      });

      if (response.ok) {
        fetchFinance();
        resetFinanceForm();
        showToast("Catatan berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Error adding finance record:", error);
    }
  };

  const submitEditFinance = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editFinance.amount || !editingFinanceId) return;

    try {
      const response = await fetch(
        `${workerUrl}/api/finance/${editingFinanceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editFinance,
            amount: parseFloat(editFinance.amount),
            date: new Date().toISOString().split("T")[0],
            createdAt: Date.now(),
          }),
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
  };

  const resetFinanceForm = () => {
    setNewFinance({
      type: "expense",
      amount: "",
      description: "",
      category: "Umum",
      date: new Date().toISOString().split("T")[0],
    });
    setIsFormVisible(false);
  };

  const startEditFinance = (record: FinanceRecord) => {
    setEditFinance({
      type: record.type,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      date: record.date,
    });
    setEditingFinanceId(record.id);
  };

  const deleteFinance = async (id: string) => {
    try {
      await fetch(`${workerUrl}/api/finance/${id}`, { method: "DELETE" });
      setFinanceRecords(financeRecords.filter((r) => r.id !== id));
      showToast("Catatan berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting finance:", error);
    }
  };

  const testConnection = async (url: string) => {
    setConnectionStatus("testing");
    // Normalize URL: remove trailing slashes
    const normalizedUrl = url.replace(/\/+$/, "");

    try {
      // Try to fetch categories as a soft health check
      const res = await fetch(`${normalizedUrl}/api/finance-categories`);
      if (res.ok) {
        setConnectionStatus("connected");
        localStorage.setItem("worker_url", normalizedUrl);
        setWorkerUrl(normalizedUrl);
        return true;
      }
      setConnectionStatus("error");
    } catch (e) {
      setConnectionStatus("error");
    }
    return false;
  };

  // Derive filtered records based on all filters
  const filteredRecords = React.useMemo(() => {
    let records = [...financeRecords];

    // View mode filter (all/income/expense)
    if (financeViewMode !== "all") {
      records = records.filter((r) => r.type === financeViewMode);
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
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);
    const expense = filteredRecords
      .filter((r) => r.type === "expense")
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

  const reportFilteredRecords = React.useMemo(() => {
    let filtered = [...financeRecords];

    // Filter by Type
    if (reportConfig.selectedType !== "all") {
      filtered = filtered.filter((r) => r.type === reportConfig.selectedType);
    }

    // Filter by Category
    if (reportConfig.selectedCategory !== "all") {
      filtered = filtered.filter(
        (r) => r.category === reportConfig.selectedCategory,
      );
    }

    // Filter by Range
    if (reportConfig.rangeType === "monthly") {
      filtered = filtered.filter((r) =>
        r.date.startsWith(reportConfig.selectedMonth),
      );
    } else if (reportConfig.rangeType === "yearly") {
      filtered = filtered.filter(
        (r) => new Date(r.date).getFullYear() === reportConfig.selectedYear,
      );
    }

    return filtered;
  }, [financeRecords, reportConfig]);

  const topIncomeRecords = React.useMemo(() => {
    return [...reportFilteredRecords]
      .filter((r) => r.type === "income")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [reportFilteredRecords]);

  const topExpenseRecords = React.useMemo(() => {
    return [...reportFilteredRecords]
      .filter((r) => r.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [reportFilteredRecords]);

  const exportFilteredExcel = () => {
    const filtered = [...reportFilteredRecords];

    if (filtered.length === 0) {
      alert("Tidak ada data untuk kriteria ini.");
      return;
    }

    // Sort by date desc
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Group by Month-Year (e.g., "Januari 2024")
    const groupedByMonth = new Map<string, FinanceRecord[]>();
    filtered.forEach((record) => {
      const d = new Date(record.date);
      const monthYear = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      if (!groupedByMonth.has(monthYear)) {
        groupedByMonth.set(monthYear, []);
      }
      groupedByMonth.get(monthYear)!.push(record);
    });

    const workbook = XLSX.utils.book_new();

    groupedByMonth.forEach((monthRecords, monthName) => {
      const totalInc = monthRecords
        .filter((x) => x.type === "income")
        .reduce((sum, x) => sum + x.amount, 0);
      const totalExp = monthRecords
        .filter((x) => x.type === "expense")
        .reduce((sum, x) => sum + x.amount, 0);

      const topInc = [...monthRecords]
        .filter((r) => r.type === "income")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const topExp = [...monthRecords]
        .filter((r) => r.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID");

      const aoa: any[][] = [];

      // 1. Header & Summary
      aoa.push([`LAPORAN KEUANGAN - ${monthName.toUpperCase()}`]);
      aoa.push([]);
      aoa.push(["RINGKASAN"]);
      aoa.push(["Total Pemasukan", totalInc]);
      aoa.push(["Total Pengeluaran", totalExp]);
      aoa.push(["Saldo Netto", totalInc - totalExp]);
      aoa.push([]);

      // 2. Top 5 Income
      if (topInc.length > 0) {
        aoa.push(["TOP 5 PEMASUKAN"]);
        aoa.push(["Tanggal", "Kategori", "Nominal (Rp)", "Keterangan"]);
        topInc.forEach((r) => {
          aoa.push([formatDate(r.date), parseCategory(r.category).name, r.amount, r.description || "-"]);
        });
        aoa.push([]);
      }

      // 3. Top 5 Expense
      if (topExp.length > 0) {
        aoa.push(["TOP 5 PENGELUARAN"]);
        aoa.push(["Tanggal", "Kategori", "Nominal (Rp)", "Keterangan"]);
        topExp.forEach((r) => {
          aoa.push([formatDate(r.date), parseCategory(r.category).name, r.amount, r.description || "-"]);
        });
        aoa.push([]);
      }

      // 4. All Transactions
      aoa.push(["RINCIAN TRANSAKSI"]);
      aoa.push(["Tanggal", "Kategori", "Tipe", "Nominal (Rp)", "Keterangan"]);
      monthRecords.forEach((r) => {
        aoa.push([
          formatDate(r.date),
          parseCategory(r.category).name,
          r.type === "income" ? "Pemasukan" : "Pengeluaran",
          r.amount,
          r.description || "-",
        ]);
      });

      const sheet = XLSX.utils.aoa_to_sheet(aoa);

      // Simple column widths
      sheet["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 50 },
      ];

      // Format safe sheet name (max 31 chars, no brackets)
      const safeSheetName = monthName.replace(/[\[\]\*\?\/\\\:]/g, "").slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName);
    });

    const fileName = `laporan_${reportConfig.rangeType}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getFullDateTime = (dateStr: string, timestamp: number) => {
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
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === "record" && deleteConfirm.id) {
      deleteFinance(deleteConfirm.id);
    } else if (deleteConfirm.type === "category" && deleteConfirm.id) {
      deleteFinanceCategory(deleteConfirm.id);
    }
    setDeleteConfirm({ show: false, type: null, id: null, label: null });
  };

  const openDeleteConfirm = (
    type: "record" | "category",
    id: string,
    label: string,
  ) => {
    setDeleteConfirm({ show: true, type, id, label });
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FBFBF9] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white overflow-hidden">
      {/* Notifications / Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          >
            <div
              className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-200"
                  : "bg-rose-600 text-white border-rose-500 shadow-rose-200"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === "success" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setDeleteConfirm({
                  show: false,
                  type: null,
                  id: null,
                  label: null,
                })
              }
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative shadow-2xl z-10 border border-slate-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Apakah Yakin Ingin Menghapus?
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan.{" "}
                  {deleteConfirm.type === "category"
                    ? "Semua catatan dengan kategori ini mungkin akan terpengaruh."
                    : `Data "${deleteConfirm.label}" akan dihapus permanen.`}
                </p>

                <div className="flex flex-col w-full gap-2 mt-8">
                  <button
                    onClick={confirmDelete}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest shadow-lg shadow-red-100"
                  >
                    Ya, Hapus Sekarang
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        show: false,
                        type: null,
                        id: null,
                        label: null,
                      })
                    }
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Application Header - Now at top of everything */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-all active:scale-95 hidden md:flex items-center justify-center border border-slate-100 shadow-sm"
            title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </button>

          <div className="flex items-center gap-2.5 ml-1">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Wallet size={16} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter leading-none text-slate-900">
                KeuanganKu
              </h1>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                Sub Main Workspace
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Info (Worker Status) */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-200">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : connectionStatus === "testing"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-rose-500"
              }`}
            />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Worker:{" "}
              <span
                className={
                  connectionStatus === "connected"
                    ? "text-emerald-600"
                    : connectionStatus === "testing"
                      ? "text-amber-600"
                      : "text-rose-500"
                }
              >
                {connectionStatus === "connected"
                  ? "Online"
                  : connectionStatus === "testing"
                    ? "Menghubungkan"
                    : "Offline"}
              </span>
            </span>
          </div>

          {/* Refresh Control */}
          <button
            onClick={fetchFinance}
            disabled={isRefreshing}
            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-all group"
            title="Refresh Data"
          >
            <RefreshCw
              size={16}
              className={`${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="md:hidden flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-all group"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop - Now below header */}
        <motion.aside
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="hidden md:flex flex-col bg-white border-r border-slate-100 p-4 pt-6 overflow-hidden whitespace-nowrap z-40 shadow-sm"
        >
          <nav className="space-y-2 flex-1">
            <SidebarLink
              active={activeTab === "finance"}
              onClick={() => setActiveTab("finance")}
              icon={<Wallet size={20} />}
              label="Catatan Keuangan"
              collapsed={!isSidebarOpen}
            />
            <SidebarLink
              active={activeTab === "categories"}
              onClick={() => setActiveTab("categories")}
              icon={<Tags size={20} />}
              label="Kelola Kategori"
              collapsed={!isSidebarOpen}
            />
            <SidebarLink
              active={activeTab === "budgets"}
              onClick={() => setActiveTab("budgets")}
              icon={<PieChart size={20} />}
              label="Budgeting"
              collapsed={!isSidebarOpen}
            />
            <SidebarLink
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
              icon={<BarChart3 size={20} />}
              label="Laporan Excel"
              collapsed={!isSidebarOpen}
            />
            <SidebarLink
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              icon={<Settings size={20} />}
              label="Pengaturan"
              collapsed={!isSidebarOpen}
            />
          </nav>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-50 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto noscrollbar pb-20">
            {/* Finance View */}
            <main className="max-w-xl mx-auto px-4 md:px-6 py-4 md:py-8">
              <AnimatePresence mode="wait">
                {activeTab === "finance" ? (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Add Button */}
                    <button
                      onClick={() => setIsFormVisible(true)}
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
                                        });
                                        localStorage.setItem("last_transaction_type", "income");
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${newFinance.type === "income" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                      <TrendingUp size={14} /> PEMASUKAN
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewFinance({
                                          ...newFinance,
                                          type: "expense",
                                        });
                                        localStorage.setItem("last_transaction_type", "expense");
                                      }}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${newFinance.type === "expense" ? "bg-white text-rose-500 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
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
                    <div className="space-y-6 mb-8">
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
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                              <Calendar size={12} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                              {selectedDateFilter
                                ? availableMonths.find(
                                    (m) =>
                                      m.month === selectedDateFilter.month &&
                                      m.year === selectedDateFilter.year,
                                  )?.label
                                : "Ringkasan Seluruh Periode"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${stats.balance >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                            ></div>
                            <span
                              className={`text-[10px] font-black tracking-tighter ${stats.balance >= 0 ? "text-slate-900" : "text-rose-500"}`}
                            >
                              Rp {stats.balance.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                              Pemasukan
                            </span>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp
                                size={10}
                                className="text-emerald-500"
                              />
                              <span className="text-xs font-black tracking-tight text-emerald-600 truncate">
                                + Rp {stats.income.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                              Pengeluaran
                            </span>
                            <div className="flex items-center gap-1.5">
                              <TrendingDown
                                size={10}
                                className="text-rose-500"
                              />
                              <span className="text-xs font-black tracking-tight text-rose-500 truncate">
                                - Rp {stats.expense.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>
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
                      {Object.entries(
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
                          const monthIncome = (records as FinanceRecord[])
                            .filter((r) => r.type === "income")
                            .reduce((sum, r) => sum + r.amount, 0);
                          const monthExpense = (records as FinanceRecord[])
                            .filter((r) => r.type === "expense")
                            .reduce((sum, r) => sum + r.amount, 0);
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
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-emerald-600">
                                      + Rp {monthIncome.toLocaleString("id-ID")}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[9px] font-black text-rose-500">
                                      - Rp{" "}
                                      {monthExpense.toLocaleString("id-ID")}
                                    </span>
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
                                      {/* Category Breakdown Summary with Toggle */}
                                      <div className="mx-4 mt-4 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <button
                                          onClick={() => {
                                            if (
                                              collapsedCategories.includes(
                                                month,
                                              )
                                            ) {
                                              setCollapsedCategories((prev) =>
                                                prev.filter((m) => m !== month),
                                              );
                                            } else {
                                              setCollapsedCategories((prev) => [
                                                ...prev,
                                                month,
                                              ]);
                                            }
                                          }}
                                          className="w-full flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-100/50 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <PieChart
                                              size={12}
                                              className="text-slate-500"
                                            />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                              Ringkasan Kategori
                                            </span>
                                          </div>
                                          <ChevronDown
                                            size={14}
                                            className={`text-slate-400 transition-transform duration-300 ${collapsedCategories.includes(month) ? "" : "rotate-180"}`}
                                          />
                                        </button>

                                        <AnimatePresence initial={false}>
                                          {!collapsedCategories.includes(
                                            month,
                                          ) && (
                                            <motion.div
                                              initial={{
                                                height: 0,
                                                opacity: 0,
                                              }}
                                              animate={{
                                                height: "auto",
                                                opacity: 1,
                                              }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {Object.entries(
                                                  (
                                                    records as FinanceRecord[]
                                                  ).reduce(
                                                    (acc, r) => {
                                                      if (!acc[r.category])
                                                        acc[r.category] = 0;
                                                      acc[r.category] +=
                                                        r.type === "income"
                                                          ? r.amount
                                                          : -r.amount;
                                                      return acc;
                                                    },
                                                    {} as Record<
                                                      string,
                                                      number
                                                    >,
                                                  ),
                                                ).map(([cat, total]) => (
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
                                                      {(total as number) >= 0
                                                        ? "+"
                                                        : ""}{" "}
                                                      Rp{" "}
                                                      {Math.abs(
                                                        total as number,
                                                      ).toLocaleString("id-ID")}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>

                                      <div className="divide-y divide-slate-100 mt-2">
                                        {(records as FinanceRecord[])
                                          .sort(
                                            (a, b) =>
                                              new Date(b.date).getTime() -
                                              new Date(a.date).getTime(),
                                          )
                                          .map((record) => (
                                            <div
                                              key={record.id}
                                              onClick={() =>
                                                setExpandedId(
                                                  expandedId === record.id
                                                    ? null
                                                    : record.id,
                                                )
                                              }
                                              className="flex flex-col gap-0 group hover:bg-slate-50/80 transition-all cursor-pointer"
                                            >
                                              <div className="flex flex-row items-center justify-between gap-2 px-4 py-2">
                                                <div className="flex flex-row items-center gap-2.5 overflow-hidden">
                                                  <div
                                                    className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${record.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                                                  >
                                                    {record.type ===
                                                    "income" ? (
                                                      <TrendingUp size={14} />
                                                    ) : (
                                                      <TrendingDown size={14} />
                                                    )}
                                                  </div>
                                                  <div className="flex flex-col min-w-0 pr-1">
                                                    <h4
                                                      className={`text-[13px] font-black truncate leading-tight ${record.type === "income" ? "text-emerald-600" : "text-rose-500"}`}
                                                    >
                                                      {record.type === "income"
                                                        ? "+"
                                                        : "-"}{" "}
                                                      Rp{" "}
                                                      {record.amount.toLocaleString(
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
                                                                    cat.name
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
                ) : activeTab === "categories" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Tags size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">
                          Kelola Kategori
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Tambah atau hapus kategori keuangan Anda.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-3xl p-5 md:p-8 shadow-sm">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                          Tambah Kategori Baru
                        </label>
                        <div className="flex bg-slate-50 p-1 rounded-xl mb-3">
                          <button
                            type="button"
                            onClick={() => setNewCatType("income")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${newCatType === "income" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                          >
                            <TrendingUp size={14} /> PEMASUKAN
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCatType("expense")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${newCatType === "expense" ? "bg-white text-rose-500 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                          >
                            <TrendingDown size={14} /> PENGELUARAN
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Misal: Investasi, Hobi..."
                            className="flex-1 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (addFinanceCategory(newCatName, newCatType),
                              setNewCatName(""))
                            }
                          />
                          <button
                            onClick={() => {
                              addFinanceCategory(newCatName, newCatType);
                              setNewCatName("");
                            }}
                            className="bg-emerald-600 text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                          >
                            Tambah
                          </button>
                        </div>
                      </div>

                      <div className="mt-10">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 block mb-4">
                          Daftar Kategori Saat Ini
                        </label>

                        <div className="space-y-6">
                          {/* Income Categories */}
                          <div>
                            <h3 className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-2">
                              <TrendingUp size={14} /> Pemasukan
                            </h3>
                            <Reorder.Group
                              axis="y"
                              values={financeCategories.filter(c => {
                                const cat = parseCategory(c);
                                return cat.type === "income";
                              })}
                              onReorder={(newOrder) => reorderCategories(newOrder, "income")}
                              className="flex flex-col gap-3"
                            >
                              {financeCategories
                                .filter((c) => parseCategory(c).type === "income")
                                .map((rawCat) => {
                                  const cat = parseCategory(rawCat);
                                  return (
                                    <Reorder.Item
                                      key={rawCat}
                                      value={rawCat}
                                      layout
                                      transition={{ type: "spring", duration: 0.3 }}
                                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing"
                                    >
                                      {editingCatId === rawCat ? (
                                        <div className="flex-1 flex gap-2 items-center mr-2">
                                          <input
                                            autoFocus
                                            className="flex-1 p-2 bg-white border border-emerald-500 rounded-lg text-sm w-full outline-none font-bold text-slate-700"
                                            value={editingCatName}
                                            onChange={(e) => setEditingCatName(e.target.value)}
                                          />
                                          <button onClick={() => { editFinanceCategory(rawCat, editingCatName); setEditingCatId(null); }} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all">
                                            <Check size={16} />
                                          </button>
                                          <button onClick={() => setEditingCatId(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-all">
                                            <X size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex-1 flex items-center gap-3 min-w-0 pr-4">
                                            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-emerald-500">
                                              <GripVertical size={14} className="text-slate-300 cursor-grab" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 truncate pr-2">
                                              {cat.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-100">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveCategoryOrder(rawCat, "up", "income");
                                              }}
                                              className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                              title="Pindah ke Atas"
                                            >
                                              <ArrowUp size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveCategoryOrder(rawCat, "down", "income");
                                              }}
                                              className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                              title="Pindah ke Bawah"
                                            >
                                              <ArrowDown size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCatId(rawCat);
                                                setEditingCatName(cat.name);
                                              }}
                                              className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                              title="Edit Kategori"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDeleteConfirm(
                                                  "category",
                                                  rawCat,
                                                  cat.name,
                                                );
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                              title="Hapus Kategori"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </Reorder.Item>
                                  );
                                })}
                            </Reorder.Group>
                          </div>

                          {/* Expense Categories */}
                          <div className="pt-2">
                            <h3 className="text-xs font-bold text-rose-500 mb-3 flex items-center gap-2">
                              <TrendingDown size={14} /> Pengeluaran
                            </h3>
                            <Reorder.Group
                              axis="y"
                              values={financeCategories.filter(c => {
                                const cat = parseCategory(c);
                                return cat.type === "expense" || cat.type === "all";
                              })}
                              onReorder={(newOrder) => reorderCategories(newOrder, "expense")}
                              className="flex flex-col gap-3"
                            >
                              {financeCategories
                                .filter((c) => {
                                  const cat = parseCategory(c);
                                  return cat.type === "expense" || cat.type === "all";
                                })
                                .map((rawCat) => {
                                  const cat = parseCategory(rawCat);
                                  return (
                                    <Reorder.Item
                                      key={rawCat}
                                      value={rawCat}
                                      layout
                                      transition={{ type: "spring", duration: 0.3 }}
                                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing"
                                    >
                                      {editingCatId === rawCat ? (
                                        <div className="flex-1 flex gap-2 items-center mr-2">
                                          <input
                                            autoFocus
                                            className="flex-1 p-2 bg-white border border-rose-500 rounded-lg text-sm w-full outline-none font-bold text-slate-700"
                                            value={editingCatName}
                                            onChange={(e) => setEditingCatName(e.target.value)}
                                          />
                                          <button onClick={() => { editFinanceCategory(rawCat, editingCatName); setEditingCatId(null); }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-all">
                                            <Check size={16} />
                                          </button>
                                          <button onClick={() => setEditingCatId(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-all">
                                            <X size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex-1 flex items-center gap-3 min-w-0 pr-4">
                                            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-rose-400">
                                              <GripVertical size={14} className="text-slate-300 cursor-grab" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 truncate pr-2">
                                              {cat.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-100">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveCategoryOrder(rawCat, "up", "expense");
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                              title="Pindah ke Atas"
                                            >
                                              <ArrowUp size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveCategoryOrder(rawCat, "down", "expense");
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                              title="Pindah ke Bawah"
                                            >
                                              <ArrowDown size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingCatId(rawCat);
                                                setEditingCatName(cat.name);
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                              title="Edit Kategori"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDeleteConfirm(
                                                  "category",
                                                  rawCat,
                                                  cat.name,
                                                );
                                              }}
                                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                              title="Hapus Kategori"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </Reorder.Item>
                                  );
                                })}
                            </Reorder.Group>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("finance")}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors py-2"
                    >
                      <ChevronLeft size={14} /> Kembali ke Dasbor
                    </button>
                  </motion.div>
                ) : activeTab === "budgets" ? (
                  <motion.div
                    key="budgets"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BudgetsTab 
                        budgets={budgets} 
                        setBudgets={setBudgets} 
                        financeRecords={financeRecords} 
                        categories={financeCategories} 
                        trackedCategories={trackedCategories}
                        setTrackedCategories={setTrackedCategories}
                     />
                  </motion.div>
                ) : activeTab === "reports" ? (
                  <motion.div
                    key="reports"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <BarChart3 size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">
                          Laporan Excel
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Ekspor data keuangan Anda ke format Excel/CSV.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-3xl p-5 md:p-8 shadow-sm space-y-6 md:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Range Filter */}
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                            Rentang Waktu
                          </label>
                          <div className="flex bg-slate-50 p-1 rounded-xl">
                            {["all", "monthly", "yearly"].map((type) => (
                              <button
                                key={type}
                                onClick={() =>
                                  setReportConfig((prev) => ({
                                    ...prev,
                                    rangeType: type as any,
                                  }))
                                }
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${reportConfig.rangeType === type ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                {type === "all"
                                  ? "Semua"
                                  : type === "monthly"
                                    ? "Bulanan"
                                    : "Tahunan"}
                              </button>
                            ))}
                          </div>

                          {reportConfig.rangeType === "monthly" && (
                            <input
                              type="month"
                              className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-emerald-500 outline-none"
                              value={reportConfig.selectedMonth}
                              onChange={(e) =>
                                setReportConfig((prev) => ({
                                  ...prev,
                                  selectedMonth: e.target.value,
                                }))
                              }
                            />
                          )}

                          {reportConfig.rangeType === "yearly" && (
                            <select
                              className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-emerald-500 outline-none appearance-none"
                              value={reportConfig.selectedYear}
                              onChange={(e) =>
                                setReportConfig((prev) => ({
                                  ...prev,
                                  selectedYear: parseInt(e.target.value),
                                }))
                              }
                            >
                              {[2023, 2024, 2025, 2026].map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Data Type Filter */}
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                            Tipe Data
                          </label>
                          <div className="flex bg-slate-50 p-1 rounded-xl">
                            {["all", "income", "expense"].map((type) => (
                              <button
                                key={type}
                                onClick={() =>
                                  setReportConfig((prev) => ({
                                    ...prev,
                                    selectedType: type as any,
                                  }))
                                }
                                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${reportConfig.selectedType === type ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                              >
                                {type === "all"
                                  ? "Semua"
                                  : type === "income"
                                    ? "Pemasukan"
                                    : "Pengeluaran"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                            Berdasarkan Kategori
                          </label>
                          <select
                            className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-emerald-500 outline-none appearance-none"
                            value={reportConfig.selectedCategory}
                            onChange={(e) =>
                              setReportConfig((prev) => ({
                                ...prev,
                                selectedCategory: e.target.value,
                              }))
                            }
                          >
                            <option value="all">Semua Kategori</option>
                            {financeCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {parseCategory(cat).name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        {/* Top 5 Pemasukan */}
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" />{" "}
                            Top 5 Pemasukan
                          </h3>
                          {topIncomeRecords.length === 0 ? (
                            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Tidak ada data
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {topIncomeRecords.map((r, idx) => (
                                <div
                                  key={r.id || idx}
                                  className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                                >
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {parseCategory(r.category).name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(r.date).toLocaleDateString(
                                        "id-ID",
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-emerald-600 whitespace-nowrap pl-4">
                                    +Rp {r.amount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Top 5 Pengeluaran */}
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                            <TrendingDown size={14} className="text-rose-500" />{" "}
                            Top 5 Pengeluaran
                          </h3>
                          {topExpenseRecords.length === 0 ? (
                            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Tidak ada data
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {topExpenseRecords.map((r, idx) => (
                                <div
                                  key={r.id || idx}
                                  className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                                >
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {parseCategory(r.category).name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(r.date).toLocaleDateString(
                                        "id-ID",
                                      )}
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-rose-600 whitespace-nowrap pl-4">
                                    -Rp {r.amount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 italic text-[10px] text-slate-400">
                        * Tip: Pilih "Semua" pada rentang waktu jika ingin
                        mengunduh seluruh database keuangan Anda.
                      </div>

                      <button
                        onClick={exportFilteredExcel}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
                      >
                        <FileDown size={18} /> Unduh Laporan (.xlsx)
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab("finance")}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors py-2"
                    >
                      <ChevronLeft size={14} /> Kembali ke Dasbor
                    </button>
                  </motion.div>
                ) : activeTab === "settings" ? (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Settings size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">
                          Pengaturan
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Konfigurasi URL Worker dan koneksi sistem.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-3xl p-5 md:p-8 shadow-sm space-y-6 md:space-y-8">
                      <div className="space-y-6">
                        {/* Worker URL Setting */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                              Worker URL Backend
                            </label>
                            {connectionStatus === "connected" && (
                              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                                <CheckCircle2 size={10} /> Terhubung
                              </span>
                            )}
                            {connectionStatus === "error" && (
                              <span className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase tracking-widest">
                                <X size={10} /> Koneksi Gagal
                              </span>
                            )}
                          </div>

                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                              <Globe size={18} />
                            </div>
                            <input
                              type="text"
                              placeholder="https://worker-anda.workers.dev"
                              className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                              value={workerUrl}
                              onChange={(e) => {
                                setWorkerUrl(e.target.value);
                                setConnectionStatus("idle");
                              }}
                            />
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm flex-shrink-0">
                              <Activity size={18} />
                            </div>
                            <div>
                              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">
                                Status Sistem
                              </h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                URL Worker digunakan untuk menyimpan dan
                                mengambil data transaksi. Pastikan URL
                                menyertakan protokol{" "}
                                <code className="text-emerald-600 bg-emerald-50 px-1 rounded">
                                  https://
                                </code>
                                .
                              </p>
                              <p className="text-[10px] text-rose-500 leading-relaxed font-bold mt-2">
                                Penting: Pastikan Worker Anda mengaktifkan CORS
                                (Cross-Origin Resource Sharing) agar aplikasi
                                ini dapat memanggil API tersebut.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => testConnection(workerUrl)}
                            disabled={connectionStatus === "testing"}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg ${
                              connectionStatus === "connected"
                                ? "bg-emerald-600 text-white shadow-emerald-100"
                                : connectionStatus === "testing"
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-900 text-white shadow-slate-200"
                            }`}
                          >
                            {connectionStatus === "testing" ? (
                              <>
                                <RefreshCw size={18} className="animate-spin" />{" "}
                                Menguji Koneksi...
                              </>
                            ) : connectionStatus === "connected" ? (
                              <>
                                <CheckCircle2 size={18} /> Berhasil Terhubung &
                                Tersimpan
                              </>
                            ) : (
                              <>
                                <HardDrive size={18} /> Hubungkan & Simpan
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("finance")}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors py-2"
                    >
                      <ChevronLeft size={14} /> Kembali ke Dasbor
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </main>
          </div>

          {/* Space for mobile bottom nav */}
        </div>
      </div>

      {/* Mobile Navigation - Only visible on small screens */}
      <nav className="md:hidden flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] flex items-center justify-around z-50">
        <MobileNavLink
          active={activeTab === "finance"}
          onClick={() => setActiveTab("finance")}
          icon={<Wallet size={20} />}
          label="Keuangan"
        />
        <MobileNavLink
          active={activeTab === "categories"}
          onClick={() => setActiveTab("categories")}
          icon={<Tags size={20} />}
          label="Kategori"
        />
        <MobileNavLink
          active={activeTab === "budgets"}
          onClick={() => setActiveTab("budgets")}
          icon={<PieChart size={20} />}
          label="Budget"
        />
        <MobileNavLink
          active={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
          icon={<BarChart3 size={20} />}
          label="Laporan"
        />
      </nav>
    </div>
  );
}

// Mobile Bottom Nav Link Component
const MobileNavLink = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all ${
      active ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    <div className={`${active ? "bg-emerald-50 p-1.5 rounded-xl" : "p-1.5"}`}>
      {icon}
    </div>
    <span
      className={`text-[9px] font-bold tracking-widest uppercase ${active ? "text-emerald-600" : "text-slate-400"}`}
    >
      {label}
    </span>
  </button>
);

// Sidebar Link Component
const SidebarLink = ({
  active,
  onClick,
  icon,
  label,
  collapsed,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center transition-all ${
      collapsed ? "justify-center px-0 py-4 h-12" : "gap-3 px-5 py-4"
    } rounded-2xl text-xs font-bold ${
      active
        ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
    title={collapsed ? label : ""}
  >
    <div className={`${collapsed ? "flex items-center justify-center" : ""}`}>
      {icon}
    </div>
    {!collapsed && (
      <>
        <span>{label}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
      </>
    )}
  </button>
);
