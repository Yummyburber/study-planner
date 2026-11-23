const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 8080;
const dataDirectory = process.env.DATA_DIRECTORY || path.join(__dirname, "data");

fs.mkdirSync(dataDirectory, { recursive: true });
const db = new Database(path.join(dataDirectory, "study-planner.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instructor TEXT DEFAULT '',
    color TEXT DEFAULT '#647bff',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    class_id INTEGER,
    due_date TEXT NOT NULL,
    estimated_hours REAL NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "Frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", application: "Study Planner API" });
});

app.get("/api/classes", (req, res) => {
  res.json(db.prepare("SELECT * FROM classes ORDER BY name").all());
});

app.post("/api/classes", (req, res) => {
  const { name, instructor = "", color = "#647bff" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Class name is required." });
  const result = db.prepare(
    "INSERT INTO classes (name, instructor, color) VALUES (?, ?, ?)"
  ).run(name.trim(), instructor.trim(), color);
  res.status(201).json(db.prepare("SELECT * FROM classes WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/classes/:id", (req, res) => {
  const { name, instructor = "", color = "#647bff" } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Class name is required." });
  const result = db.prepare(
    "UPDATE classes SET name = ?, instructor = ?, color = ? WHERE id = ?"
  ).run(name.trim(), instructor.trim(), color, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Class not found." });
  res.json(db.prepare("SELECT * FROM classes WHERE id = ?").get(req.params.id));
});

app.delete("/api/classes/:id", (req, res) => {
  const result = db.prepare("DELETE FROM classes WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Class not found." });
  res.status(204).end();
});

app.get("/api/assignments", (req, res) => {
  const rows = db.prepare(`
    SELECT assignments.*, classes.name AS class_name, classes.color AS class_color
    FROM assignments
    LEFT JOIN classes ON assignments.class_id = classes.id
    ORDER BY assignments.completed ASC, assignments.due_date ASC
  `).all();
  res.json(rows);
});

app.post("/api/assignments", (req, res) => {
  const { title, class_id = null, due_date, estimated_hours = 1, notes = "" } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Assignment title is required." });
  if (!due_date) return res.status(400).json({ error: "Due date is required." });
  const hours = Number(estimated_hours);
  if (!Number.isFinite(hours) || hours < 0) return res.status(400).json({ error: "Study hours must be zero or greater." });

  const result = db.prepare(`
    INSERT INTO assignments (title, class_id, due_date, estimated_hours, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(title.trim(), class_id || null, due_date, hours, notes.trim());
  res.status(201).json(db.prepare(`
    SELECT assignments.*, classes.name AS class_name, classes.color AS class_color
    FROM assignments LEFT JOIN classes ON assignments.class_id = classes.id
    WHERE assignments.id = ?
  `).get(result.lastInsertRowid));
});

app.put("/api/assignments/:id", (req, res) => {
  const { title, class_id = null, due_date, estimated_hours = 1, notes = "", completed = false } = req.body;
  if (!title || !title.trim() || !due_date) {
    return res.status(400).json({ error: "Assignment title and due date are required." });
  }
  const hours = Number(estimated_hours);
  if (!Number.isFinite(hours) || hours < 0) return res.status(400).json({ error: "Study hours must be zero or greater." });
  const result = db.prepare(`
    UPDATE assignments
    SET title = ?, class_id = ?, due_date = ?, estimated_hours = ?, notes = ?, completed = ?
    WHERE id = ?
  `).run(title.trim(), class_id || null, due_date, hours, notes.trim(), completed ? 1 : 0, req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Assignment not found." });
  res.json(db.prepare(`
    SELECT assignments.*, classes.name AS class_name, classes.color AS class_color
    FROM assignments LEFT JOIN classes ON assignments.class_id = classes.id
    WHERE assignments.id = ?
  `).get(req.params.id));
});

app.patch("/api/assignments/:id/complete", (req, res) => {
  const result = db.prepare(
    "UPDATE assignments SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END WHERE id = ?"
  ).run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Assignment not found." });
  res.json(db.prepare("SELECT * FROM assignments WHERE id = ?").get(req.params.id));
});

app.delete("/api/assignments/:id", (req, res) => {
  const result = db.prepare("DELETE FROM assignments WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "Assignment not found." });
  res.status(204).end();
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "Frontend", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study Planner running on port ${PORT}`);
});
