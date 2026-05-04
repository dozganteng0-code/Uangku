import React, { useState, useMemo } from "react";
import { motion, Reorder } from "framer-motion";
import {
  Tags,
  TrendingDown,
  TrendingUp,
  Check,
  X,
  GripVertical,
  ArrowDown,
  ArrowUp,
  Edit2,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { parseCategory } from "../lib/utils";

interface CategoriesTabProps {
  financeCategories: string[];
  addFinanceCategory: (name: string, type: "income" | "expense") => void;
  reorderCategories: (newOrder: string[], type: "income" | "expense") => void;
  moveCategoryOrder: (
    catRaw: string,
    direction: "up" | "down",
    type: "income" | "expense"
  ) => void;
  editFinanceCategory: (oldRaw: string, newName: string) => void;
  openDeleteConfirm: (type: "record" | "category", id: string, name: string) => void;
  setActiveTab: (tab: string) => void;
}

export const CategoriesTab = ({
  financeCategories,
  addFinanceCategory,
  reorderCategories,
  moveCategoryOrder,
  editFinanceCategory,
  openDeleteConfirm,
  setActiveTab,
}: CategoriesTabProps) => {
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  const incomeCategories = useMemo(() => {
    return financeCategories.filter((c) => parseCategory(c).type === "income");
  }, [financeCategories]);

  const expenseCategories = useMemo(() => {
    return financeCategories.filter((c) => {
      const cat = parseCategory(c);
      return cat.type === "expense" || cat.type === "all";
    });
  }, [financeCategories]);

  return (
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
          <h2 className="text-2xl font-black text-slate-900">Kelola Kategori</h2>
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${
                newCatType === "income"
                  ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <TrendingUp size={14} /> PEMASUKAN
            </button>
            <button
              type="button"
              onClick={() => setNewCatType("expense")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold transition-all ${
                newCatType === "expense"
                  ? "bg-white text-rose-500 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addFinanceCategory(newCatName, newCatType);
                  setNewCatName("");
                }
              }}
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
                values={incomeCategories}
                onReorder={(newOrder) => reorderCategories(newOrder, "income")}
                className="flex flex-col gap-3"
              >
                {incomeCategories.map((rawCat) => {
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
                            <button
                              onClick={() => {
                                editFinanceCategory(rawCat, editingCatName);
                                setEditingCatId(null);
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-all"
                            >
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
                                  openDeleteConfirm("category", rawCat, cat.name);
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
                values={expenseCategories}
                onReorder={(newOrder) => reorderCategories(newOrder, "expense")}
                className="flex flex-col gap-3"
              >
                {expenseCategories.map((rawCat) => {
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
                            <button
                              onClick={() => {
                                editFinanceCategory(rawCat, editingCatName);
                                setEditingCatId(null);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-all"
                            >
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
                                  openDeleteConfirm("category", rawCat, cat.name);
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
  );
};
