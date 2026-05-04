import React from "react";
import { motion } from "framer-motion";
import { Settings, CheckCircle2, X, Globe, Activity, RefreshCw, HardDrive, ChevronLeft } from "lucide-react";

interface SettingsTabProps {
  workerUrl: string;
  setWorkerUrl: (url: string) => void;
  connectionStatus: "idle" | "testing" | "connected" | "error";
  setConnectionStatus: (status: "idle" | "testing" | "connected" | "error") => void;
  testConnection: (url: string) => void;
  setActiveTab: (tab: string) => void;
}

export const SettingsTab = ({
  workerUrl,
  setWorkerUrl,
  connectionStatus,
  setConnectionStatus,
  testConnection,
  setActiveTab,
}: SettingsTabProps) => {
  return (
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
  );
};
