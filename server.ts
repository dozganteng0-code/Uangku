import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database in memory for demo
  let financeRecords: any[] = [];
  let financeCategories = ['Gaji', 'Makanan', 'Rokok', 'Hiburan', 'Tagihan', 'Transportasi', 'Kesehatan', 'Belanja', 'Lainnya'];

  // Finance Categories API
  app.get("/api/finance-categories", (req, res) => {
    res.json(financeCategories);
  });

  app.post("/api/finance-categories", (req, res) => {
    const { name } = req.body;
    if (name && !financeCategories.includes(name)) {
      financeCategories.push(name);
    }
    res.json({ success: true });
  });

  app.delete("/api/finance-categories/:name", (req, res) => {
    const { name } = req.params;
    financeCategories = financeCategories.filter(c => c !== name);
    res.json({ success: true });
  });

  app.put("/api/finance-categories/:name", (req, res) => {
    const { name } = req.params;
    const { newName } = req.body;
    if (newName) {
      financeCategories = financeCategories.map(c => c === name ? newName : c);
      financeRecords = financeRecords.map(r => r.category === name ? { ...r, category: newName } : r);
    }
    res.json({ success: true });
  });

  // Finance API
  app.get("/api/finance", (req, res) => {
    res.json(financeRecords);
  });

  app.post("/api/finance", (req, res) => {
    const record = {
      ...req.body,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now()
    };
    financeRecords.push(record);
    res.status(201).json(record);
  });

  app.put("/api/finance/:id", (req, res) => {
    const { id } = req.params;
    financeRecords = financeRecords.map(r => r.id === id ? { ...r, ...req.body } : r);
    res.json({ success: true });
  });

  app.delete("/api/finance/:id", (req, res) => {
    const { id } = req.params;
    financeRecords = financeRecords.filter(r => r.id !== id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
