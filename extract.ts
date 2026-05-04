import fs from 'fs';

const appPath = 'src/App.tsx';
const appContent = fs.readFileSync(appPath, 'utf8');
const lines = appContent.split('\n');

const getLines = (start, end) => lines.slice(start - 1, end).join('\n');

const stateBlock = getLines(145, 240);
const descBlock = getLines(312, 395);
const crudBlock = getLines(630, 731);
const filterStart = lines.findIndex(l => l.includes('const filteredRecords = React.useMemo(() => {'));
const filterEnd = lines.findIndex(l => l.includes('const confirmDelete = () => {')) - 1;
const paginationBlock = getLines(filterStart + 1, filterEnd);
const uiStart = lines.findIndex(l => l.includes('<motion.div')); // We will pick the one before key="finance"
// Actually, let's just use exact string lines!
const uiStartLine = lines.findIndex(l => l.includes('key="finance"')) - 1; // 0-indexed index of <motion.div
const uiEndLine = lines.findIndex(l => l.includes(') : activeTab === "categories" ? (')); 

const uiBlock = getLines(uiStartLine + 1, uiEndLine); // getLines takes 1-indexed Start

const output = `import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, TrendingUp, TrendingDown, RefreshCw, Calendar, 
  Search, SlidersHorizontal, Edit2, Trash2, ArrowUpRight, 
  ArrowDownRight, ChevronDown, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { FinanceRecord } from '../types';
import { parseCategory, isIncomeItem, isExpenseItem, formatCurrency, getDefaultCategory } from '../lib/utils';

export const FinanceTab = ({
  workerUrl,
  connectionStatus,
  financeRecords,
  setFinanceRecords,
  financeCategories,
  fetchFinance,
  showToast,
  openDeleteConfirm
}: {
  workerUrl: string;
  connectionStatus: string;
  financeRecords: FinanceRecord[];
  setFinanceRecords: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  financeCategories: string[];
  fetchFinance: () => void;
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
  openDeleteConfirm: (type: 'record'|'category', id: string, label: string) => void;
}) => {
${stateBlock}

${descBlock}

${crudBlock}

${paginationBlock}

  return (
${uiBlock}
  );
};
`;

fs.writeFileSync('src/components/FinanceTab.tsx', output);
console.log('Successfully generated FinanceTab.tsx!');
