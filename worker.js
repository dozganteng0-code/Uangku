/**
 * CatatanKu API v3 - Professional Edition (Cloudflare Worker + D1)
 * Features: Notes, Categories, Finance Records, & Finance Categories.
 */

const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // --- API NOTES ---
      if (path === "/api/notes" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM notes ORDER BY createdAt DESC").all();
        return Response.json(results || [], { headers: corsHeaders() });
      }

      if (path === "/api/notes" && method === "POST") {
        const { title, content, category, noteDate } = await request.json();
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        await env.DB.prepare(
          "INSERT INTO notes (id, title, content, category, completed, createdAt, noteDate) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, title, content, category, 0, createdAt, noteDate).run();
        return Response.json({ id, success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/notes/") && method === "PUT") {
        const id = path.split("/").pop();
        const { title, content, category, noteDate } = await request.json();
        await env.DB.prepare(
          "UPDATE notes SET title = ?, content = ?, category = ?, noteDate = ? WHERE id = ?"
        ).bind(title, content, category, noteDate, id).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/notes/") && method === "PATCH") {
        const id = path.split("/").pop();
        const { completed } = await request.json();
        await env.DB.prepare("UPDATE notes SET completed = ? WHERE id = ?").bind(completed ? 1 : 0, id).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/notes/") && method === "DELETE") {
        const id = path.split("/").pop();
        await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      // --- API CATEGORIES (NOTES) ---
      if (path === "/api/categories" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT name FROM categories").all();
        return Response.json(results.map(r => r.name) || [], { headers: corsHeaders() });
      }

      if (path === "/api/categories" && method === "POST") {
        const { name } = await request.json();
        await env.DB.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").bind(name).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      // --- API FINANCE CATEGORIES ---
      if (path === "/api/finance-categories" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT name FROM finance_categories").all();
        return Response.json(results.map(r => r.name) || [], { headers: corsHeaders() });
      }

      if (path === "/api/finance-categories" && method === "POST") {
        const { name } = await request.json();
        await env.DB.prepare("INSERT OR IGNORE INTO finance_categories (name) VALUES (?)").bind(name).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/finance-categories/") && method === "DELETE") {
        const name = decodeURIComponent(path.split("/").pop());
        await env.DB.prepare("DELETE FROM finance_categories WHERE name = ?").bind(name).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/finance-categories/") && method === "PUT") {
        const oldName = decodeURIComponent(path.split("/").pop());
        const { newName } = await request.json();
        
        // Update category name
        await env.DB.prepare("UPDATE finance_categories SET name = ? WHERE name = ?").bind(newName, oldName).run();
        // Also update all finance records referencing the old name
        await env.DB.prepare("UPDATE finance SET category = ? WHERE category = ?").bind(newName, oldName).run();
        
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      // --- API FINANCE RECORDS ---
      if (path === "/api/finance" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM finance ORDER BY date DESC, createdAt DESC").all();
        return Response.json(results || [], { headers: corsHeaders() });
      }

      if (path === "/api/finance" && method === "POST") {
        const { type, amount, description, category, date } = await request.json();
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        await env.DB.prepare(
          "INSERT INTO finance (id, type, amount, description, category, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, type, amount, description, category, date, createdAt).run();
        return Response.json({ id, success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/finance/") && method === "PUT") {
        const id = path.split("/").pop();
        const { type, amount, description, category, date } = await request.json();
        await env.DB.prepare(
          "UPDATE finance SET type = ?, amount = ?, description = ?, category = ?, date = ? WHERE id = ?"
        ).bind(type, amount, description, category, date, id).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      if (path.startsWith("/api/finance/") && method === "DELETE") {
        const id = path.split("/").pop();
        await env.DB.prepare("DELETE FROM finance WHERE id = ?").bind(id).run();
        return Response.json({ success: true }, { headers: corsHeaders() });
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders() });

    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders() });
    }
  }
};
