import fs from 'fs';

const appPath = 'src/App.tsx';
const appContent = fs.readFileSync(appPath, 'utf8');
const lines = appContent.split('\n');

const skipRanges = [
  [145, 240],   // state block
  [312, 395],   // desc block 
  [630, 731],   // crud block
  // for filter block we use findIndex
  [lines.findIndex(l => l.includes('const filteredRecords = React.useMemo(() => {')) + 1, lines.findIndex(l => l.includes('const confirmDelete = () => {'))],
  [lines.findIndex(l => l.includes('key="finance"')) - 1, lines.findIndex(l => l.includes(') : activeTab === "categories" ? ('))]
];

// wait, the uiBlock in extract.js was `uiStartLine + 1` to `uiEndLine`
// uiStartLine was `key="finance"` - 1 which was exactly index of `<motion.div`.
// And `) : activeTab === "categories" ? (` was `uiEndLine`. It should stop right before that!
// 
const newLines = [];
let i = 0;
while (i < lines.length) {
  let skip = false;
  for (const [start, end] of skipRanges) {
    if (i + 1 >= start && i + 1 <= end) {
      // For the UI block, insert <FinanceTab /> when we hit the start line
      if (i + 1 === start && start > 1000) {
        newLines.push(`                  <FinanceTab 
                    workerUrl={workerUrl}
                    connectionStatus={connectionStatus}
                    financeRecords={financeRecords as FinanceRecord[]}
                    setFinanceRecords={setFinanceRecords}
                    financeCategories={financeCategories}
                    fetchFinance={fetchFinance}
                    showToast={showToast}
                    openDeleteConfirm={openDeleteConfirm}
                  />`);
      }
      skip = true;
      break;
    }
  }
  if (!skip) {
    newLines.push(lines[i]);
  }
  i++;
}

// Ensure the FinanceTab is imported. 
const importsIndex = newLines.findIndex(l => l.includes('import { ReportsTab }'));
newLines.splice(importsIndex, 0, 'import { FinanceTab } from "./components/FinanceTab";');

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log('App.tsx effectively replaced!');
