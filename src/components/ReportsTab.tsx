import React, { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, FileDown, Image as ImageIcon, ChevronLeft, TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import * as XLSX from "xlsx";
import { toJpeg } from "html-to-image";
import { FinanceRecord } from "../types";
import { parseCategory, isExpenseItem, isIncomeItem, getCategoryDisplayName } from "../lib/utils";

interface ReportsTabProps {
  financeRecords: FinanceRecord[];
  financeCategories: string[];
  setActiveTab: (tab: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const ReportsTab = ({
  financeRecords,
  financeCategories,
  setActiveTab,
  showToast,
}: ReportsTabProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const exportTableRef = useRef<HTMLDivElement>(null);

  const [reportConfig, setReportConfig] = useState({
    rangeType: "monthly" as "all" | "monthly" | "yearly",
    selectedMonth: new Date().toISOString().substring(0, 7),
    selectedYear: new Date().getFullYear(),
    selectedType: "all",
    selectedCategory: "all",
  });

  const reportFilteredRecords = useMemo(() => {
    return financeRecords.filter((r) => {
      // Type filter
      if (reportConfig.selectedType !== "all") {
        if (reportConfig.selectedType === "income" && !isIncomeItem(r.type, r.category)) return false;
        if (reportConfig.selectedType === "expense" && !isExpenseItem(r.type, r.category)) return false;
      }
      
      // Category Filter
      if (reportConfig.selectedCategory !== "all") {
        if (r.category !== reportConfig.selectedCategory) return false;
      }

      // Date Filter
      if (reportConfig.rangeType === "monthly") {
        if (!r.date.startsWith(reportConfig.selectedMonth)) return false;
      } else if (reportConfig.rangeType === "yearly") {
        if (new Date(r.date).getFullYear() !== reportConfig.selectedYear) return false;
      }

      return true;
    });
  }, [financeRecords, reportConfig]);

  const trendData = useMemo(() => {
    // Trend for the last 6 months or current selection
    const monthsMap = new Map<string, { income: number; expense: number; label: string; sortKey: number }>();
    
    financeRecords.forEach(r => {
      const d = new Date(r.date);
      const m = d.getMonth() as number;
      const y = d.getFullYear() as number;
      const key = `${y}-${(m+1).toString().padStart(2, '0')}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { 
          income: 0, 
          expense: 0, 
          label: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
          sortKey: (y * 12 + m) as number
        });
      }
      const entry = monthsMap.get(key)!;
      if (isIncomeItem(r.type, r.category)) entry.income += r.amount;
      if (isExpenseItem(r.type, r.category)) entry.expense += r.amount;
    });

    return Array.from(monthsMap.values())
      .sort((a, b) => (a.sortKey as number) - (b.sortKey as number))
      .slice(-6)
      .map(m => ({
        name: m.label,
        pemasukan: m.income,
        pengeluaran: m.expense
      }));
  }, [financeRecords]);

  const pieData = useMemo(() => {
    const expenses = reportFilteredRecords.filter(r => isExpenseItem(r.type, r.category));
    const grouped = expenses.reduce((acc, r) => {
      const name = getCategoryDisplayName(r.category, financeCategories);
      if (!acc[name]) acc[name] = 0;
      acc[name] += r.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [reportFilteredRecords, financeCategories]);

  const topIncomeRecords = useMemo(() => {
    return [...reportFilteredRecords]
      .filter((r) => isIncomeItem(r.type, r.category))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [reportFilteredRecords]);

  const topExpenseRecords = useMemo(() => {
    return [...reportFilteredRecords]
      .filter((r) => isExpenseItem(r.type, r.category))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [reportFilteredRecords]);

  const exportFilteredImage = async () => {
    if (exportTableRef.current === null) {
      alert("Tidak dapat menemukan elemen laporan untuk diekspor.");
      return;
    }
    
    const filtered = [...reportFilteredRecords];
    if (filtered.length === 0) {
      alert("Tidak ada data untuk kriteria ini.");
      return;
    }

    try {
      showToast("Sedang membuat gambar laporan...", "info");
      
      // Temporary unhide for rendering
      const el = exportTableRef.current;
      const prevDisplay = el.style.display;
      el.style.display = 'block';
      
      const dataUrl = await toJpeg(el, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
      
      el.style.display = prevDisplay;

      const link = document.createElement('a');
      const filename = `Laporan_Keuangan_${reportConfig.rangeType}_${reportConfig.rangeType === 'monthly' ? reportConfig.selectedMonth : reportConfig.selectedYear}.jpg`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
      showToast("Berhasil mengunduh gambar laporan!", "success");
    } catch (err) {
      console.error("Export image error:", err);
      showToast("Gagal mengunduh gambar.", "error");
    }
  };

  const exportFilteredExcel = () => {
    const filtered = [...reportFilteredRecords];

    if (filtered.length === 0) {
      alert("Tidak ada data untuk kriteria ini.");
      return;
    }

    const dataToExport = filtered.map((r) => ({
      Tanggal: new Date(r.date).toLocaleDateString("id-ID"),
      "Tipe Transaksi": isIncomeItem(r.type, r.category)
        ? "Pemasukan"
        : "Pengeluaran",
      Kategori: parseCategory(r.category).name,
      Keterangan: r.description || "-",
      "Nominal (Rp)": r.amount,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");

    // Format Column Width
    ws["!cols"] = [
      { wch: 15 }, // Tanggal
      { wch: 15 }, // Tipe
      { wch: 20 }, // Kategori
      { wch: 40 }, // Keterangan
      { wch: 20 }, // Nominal
    ];

    const fileName = `laporan_${reportConfig.rangeType}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <>
      <motion.div
        key="reports"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
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
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Trend Pemasukan vs Pengeluaran</span>
              </div>
              <div className="h-[200px] w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-bold italic">Belum ada data bulanan</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PieChartIcon size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Analisis Kategori (Filter Aktif)</span>
              </div>
              <div className="h-[200px] w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-bold italic">Belum ada data pengeluaran</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
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
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      reportConfig.rangeType === type
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
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
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      reportConfig.selectedType === type
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
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
                          {new Date(r.date).toLocaleDateString("id-ID")}
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
                          {new Date(r.date).toLocaleDateString("id-ID")}
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
            * Tip: Pilih "Semua" pada rentang waktu jika ingin mengunduh
            seluruh database keuangan Anda.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={exportFilteredExcel}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
          >
            <FileDown size={18} /> Unduh (.xlsx)
          </button>
          <button
            onClick={exportFilteredImage}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
          >
            <ImageIcon size={18} /> Unduh Gambar (.jpg)
          </button>
        </div>

        <button
          onClick={() => setActiveTab("finance")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors py-2"
        >
          <ChevronLeft size={14} /> Kembali ke Dasbor
        </button>
      </motion.div>

      {/* Hidden Table for Export Image */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={exportTableRef} className="bg-white p-10 w-[800px] text-slate-900 font-sans" style={{ display: 'none' }}>
          <h1 className="text-3xl font-black text-slate-900 mb-2">LAPORAN KEUANGAN</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">
            {reportConfig.rangeType === 'monthly' ? `Periode: ${reportConfig.selectedMonth} ${reportConfig.selectedYear}` : `Tahun: ${reportConfig.selectedYear}`}<br/>
            Kategori: {reportConfig.selectedCategory === "all" ? "Semua Kategori" : parseCategory(reportConfig.selectedCategory).name} • Tipe: {reportConfig.selectedType === "all" ? "Semua Tipe" : reportConfig.selectedType === "income" ? "Pemasukan" : "Pengeluaran"}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Total Pemasukan</p>
              <p className="text-xl font-black text-emerald-700">Rp {reportFilteredRecords.filter((r) => isIncomeItem(r.type, r.category)).reduce((sum, r) => sum + r.amount, 0).toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Total Pengeluaran</p>
              <p className="text-xl font-black text-rose-700">Rp {reportFilteredRecords.filter((r) => isExpenseItem(r.type, r.category)).reduce((sum, r) => sum + r.amount, 0).toLocaleString("id-ID")}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Nominal</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportFilteredRecords.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-xs font-bold text-slate-600">
                    {new Date(r.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                      {parseCategory(r.category).name}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-xs font-black text-right ${isIncomeItem(r.type, r.category) ? "text-emerald-600" : "text-rose-500"}`}>
                    {isIncomeItem(r.type, r.category) ? "+" : "-"} Rp {r.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                    {r.description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {reportFilteredRecords.length === 0 && (
            <div className="text-center py-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
              Tidak ada data.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
