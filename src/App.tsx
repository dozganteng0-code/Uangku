/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toJpeg } from "html-to-image";
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
  Image,
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

import { BudgetsTab } from "./components/BudgetsTab";
import { CategoriesTab } from "./components/CategoriesTab";
import { FinanceTab } from "./components/FinanceTab";
import { ReportsTab } from "./components/ReportsTab";
import { SettingsTab } from "./components/SettingsTab";

import { parseCategory, getCategoryDisplayName } from "./lib/utils";

// Auto-detect if running on AI Studio and use the local mock server if needed
const DEFAULT_API_URL = "";


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

    // Auto-connect if worker_url exists
    const savedUrl = localStorage.getItem("worker_url");
    if (savedUrl && (connectionStatus === "idle" || connectionStatus === "error")) {
      testConnection(savedUrl);
    }

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
  const getDefaultCategory = (type: "income" | "expense", categories: string[]) => {
    const allowed = categories.filter(c => {
      const pc = parseCategory(c);
      return pc.type === "all" || pc.type === type;
    });
    return allowed.length > 0 ? allowed[0] : "";
  };

  const [activeTab, setActiveTab] = useState<
    "finance" | "categories" | "reports" | "settings" | "budgets"
  >("finance");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar_open");
    return saved !== null ? saved === "true" : true;
  });
  useEffect(() => {
    localStorage.setItem("sidebar_open", isSidebarOpen.toString());
  }, [isSidebarOpen]);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
    id?: number;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDeleteRef = useRef<{ id: string; record: FinanceRecord } | null>(null);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000); // 4s so user has time to see and click undo (3s logic)
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.message, toast.type, toast.id]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: "record" | "category" | null;
    id: string | null;
    label: string | null;
  }>({ show: false, type: null, id: null, label: null });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = useCallback((
    message: string,
    type: "success" | "error" = "success",
    actionLabel?: string,
    onAction?: () => void
  ) => {
    setToast({ show: true, message, type, id: Date.now(), actionLabel, onAction });
  }, []);

  const fetchFinance = useCallback(async () => {
    if (!workerUrl || connectionStatus !== "connected") return;
    setLoading(true);
    try {
      const res = await fetch(`${workerUrl}/api/finance`);
      if (res.ok) {
        let data = await res.json();
        if (Array.isArray(data)) {
          data = data.map((d: any) => ({
             ...d,
             type: d.type || (typeof d.category === "string" && d.category.startsWith("income::") ? "income" : "expense")
          }));
        }
        console.log("Fetched finance records data:", data);
        setFinanceRecords(data);
      } else {
        console.error("Failed to fetch finance records, status:", res.status);
      }
    } catch (err) {
      console.error("Error fetching finance:", err);
    } finally {
      setLoading(false);
    }
  }, [workerUrl, connectionStatus]);

  const fetchFinanceCategories = useCallback(async () => {
    if (!workerUrl || connectionStatus !== "connected") return;
    setLoading(true);
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
      }
    } catch (err) {
      console.error("Error fetching finance categories:", err);
    } finally {
      setLoading(false);
    }
  }, [workerUrl, connectionStatus]);

  const cancelDeletion = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    
    if (pendingDeleteRef.current) {
      const { record } = pendingDeleteRef.current;
      setFinanceRecords(prev => {
        if (prev.some(r => r.id === record.id)) return prev;
        return [...prev, record].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      pendingDeleteRef.current = null;
      showToast("Penghapusan dibatalkan", "success");
    }
  }, [showToast]);

  const deleteFinance = useCallback(async (id: string, immediate: boolean = false) => {
    const recordToDelete = financeRecords.find(r => r.id === id);
    if (!recordToDelete) return;

    // Optimistic UI updates
    setFinanceRecords((prev) => prev.filter((r) => r.id !== id));

    if (immediate) {
      try {
        await fetch(`${workerUrl}/api/finance/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        showToast("Catatan berhasil dihapus!");
      } catch (err) {
        console.error("Error deleting finance:", err);
        showToast("Gagal menghapus catatan.", "error");
        fetchFinance(); // Revert
      }
      return;
    }

    // Delayed deletion for Undo
    pendingDeleteRef.current = { id, record: recordToDelete };
    
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    
    showToast("Catatan dihapus", "success", "BATAL", cancelDeletion);

    undoTimeoutRef.current = setTimeout(async () => {
      try {
        if (!pendingDeleteRef.current || pendingDeleteRef.current.id !== id) return;
        
        await fetch(`${workerUrl}/api/finance/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        pendingDeleteRef.current = null;
        undoTimeoutRef.current = null;
      } catch (err) {
        console.error("Error deleting finance:", err);
        showToast("Gagal menghapus catatan di server.", "error");
        fetchFinance(); // Revert
      }
    }, 3000);
  }, [workerUrl, showToast, fetchFinance, financeRecords, cancelDeletion]);

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

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const addDescRef = useRef<HTMLTextAreaElement>(null);
  const editDescRef = useRef<HTMLTextAreaElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
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


  const moveCategoryOrder = useCallback((
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
  }, []);

  useEffect(() => {
    if (connectionStatus !== "connected" || !workerUrl) {
      setLoading(false);
      return;
    }
    
    const initFetch = async () => {
      setLoading(true);
      await Promise.all([fetchFinance(), fetchFinanceCategories()]);
      setLoading(false);
    };

    initFetch();

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
  }, [workerUrl, connectionStatus]);

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

  const isIncomeItem = (type: any, category?: string) => {
    const t = String(type || "").toLowerCase().trim();
    if (t === "income" || t === "pemasukan") return true;
    if (typeof category === "string" && category.startsWith("income::")) return true;
    return false;
  };

  const isExpenseItem = (type: any, category?: string) => {
    const t = String(type || "").toLowerCase().trim();
    if (t === "expense" || t === "pengeluaran") return true;
    if (typeof category === "string" && category.startsWith("expense::")) return true;
    return false;
  };

  const getFinanceTypeDisplay = (type: any, category?: string) => {
    return isIncomeItem(type, category) ? "Pemasukan" : "Pengeluaran";
  };

  const addFinanceCategory = useCallback(async (
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
  }, [financeCategories, workerUrl, showToast]);

  const editFinanceCategory = useCallback(async (oldRawName: string, newRealName: string) => {
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
  }, [financeCategories, workerUrl, showToast, fetchFinanceCategories, fetchFinance]);

  const reorderCategories = useCallback((newTypeOrder: string[], type: "income" | "expense") => {
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
  }, []);

  const deleteFinanceCategory = useCallback(async (rawName: string) => {
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
  }, [workerUrl, showToast]);

  const testConnection = useCallback(async (url: string) => {
    if (!url.startsWith("https://")) {
      setConnectionStatus("error");
      showToast("URL Worker harus dimulai dengan https://", "error");
      return false;
    }

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
        showToast("Koneksi ke worker berhasil!", "success");
        return true;
      }
      setConnectionStatus("error");
      showToast("Gagal terhubung ke worker. Pastikan URL benar dan Worker aktif.", "error");
    } catch (e) {
      setConnectionStatus("error");
      showToast("Terjadi kesalahan koneksi. Pastikan URL valid dan dapat diakses.", "error");
    }
    return false;
  }, [showToast]);

  // Derive filtered records based on all filters
  const confirmDelete = useCallback(() => {
    if (deleteConfirm.type === "record" && deleteConfirm.id) {
      deleteFinance(deleteConfirm.id, true);
    } else if (deleteConfirm.type === "category" && deleteConfirm.id) {
      deleteFinanceCategory(deleteConfirm.id);
    }
    setDeleteConfirm({ show: false, type: null, id: null, label: null });
  }, [deleteConfirm, deleteFinance, deleteFinanceCategory]);

  const openDeleteConfirm = useCallback((
    type: "record" | "category",
    id: string,
    label: string,
  ) => {
    setDeleteConfirm({ show: true, type, id, label });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#FBFBF9] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white overflow-hidden">
      {/* Notifications / Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
          >
            <div
              className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 border ${
                toast.type === "success"
                  ? "bg-slate-900 text-white border-slate-800 shadow-xl"
                  : "bg-rose-600 text-white border-rose-500 shadow-xl"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'}`}>
                  {toast.type === "success" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <AlertTriangle size={12} />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {toast.message}
                </span>
              </div>
              
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    setToast(prev => ({ ...prev, show: false }));
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg transition-all active:scale-95 uppercase tracking-tighter"
                >
                  {toast.actionLabel}
                </button>
              )}
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
                  <FinanceTab 
                    loading={loading}
                    workerUrl={workerUrl}
                    connectionStatus={connectionStatus}
                    financeRecords={financeRecords as FinanceRecord[]}
                    setFinanceRecords={setFinanceRecords}
                    financeCategories={financeCategories}
                    fetchFinance={fetchFinance}
                    showToast={showToast}
                    openDeleteConfirm={openDeleteConfirm}
                    deleteFinance={deleteFinance}
                    collapsedMonths={collapsedMonths}
                    setCollapsedMonths={setCollapsedMonths}
                    collapsedCategories={collapsedCategories}
                    setCollapsedCategories={setCollapsedCategories}
                  />
                ) : activeTab === "categories" ? (
                  <CategoriesTab
                    financeCategories={financeCategories}
                    addFinanceCategory={addFinanceCategory}
                    reorderCategories={reorderCategories}
                    moveCategoryOrder={moveCategoryOrder}
                    editFinanceCategory={editFinanceCategory}
                    openDeleteConfirm={openDeleteConfirm}
                    setActiveTab={setActiveTab}
                  />
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
                  <ReportsTab
                    financeRecords={financeRecords as FinanceRecord[]}
                    financeCategories={financeCategories}
                    setActiveTab={setActiveTab}
                    showToast={showToast}
                  />
                ) : activeTab === "settings" ? (
                  <SettingsTab
                    workerUrl={workerUrl}
                    setWorkerUrl={setWorkerUrl}
                    connectionStatus={connectionStatus}
                    setConnectionStatus={setConnectionStatus}
                    testConnection={testConnection}
                    setActiveTab={setActiveTab}
                  />
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
