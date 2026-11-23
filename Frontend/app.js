const API = "/api";
let classes = [];
let assignments = [];
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const assignmentDialog = $("#assignment-dialog");
const classDialog = $("#class-dialog");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function prettyDate(value) {
  if (!value) return "No due date";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
async function request(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  return response.status === 204 ? null : response.json();
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function setToday() {
  const now = new Date();
  $("#today-label").textContent = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const hour = now.getHours();
  $("#greeting").textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
async function loadData() {
  try {
    [classes, assignments] = await Promise.all([
      request("/classes"),
      request("/assignments")
    ]);
    render();
  } catch (error) {
    $("#assignment-list").innerHTML = `<div class="empty-state">Could not load the planner. ${escapeHtml(error.message)}</div>`;
    showToast(error.message);
  }
}
function render() {
  renderStats();
  renderClasses();
  renderAssignments();
  updateClassOptions();
}
function renderStats() {
  const open = assignments.filter((item) => !item.completed);
  const completed = assignments.filter((item) => item.completed);
  const hours = open.reduce((total, item) => total + Number(item.estimated_hours || 0), 0);
  $("#stat-upcoming").textContent = open.length;
  $("#stat-hours").textContent = `${Number(hours.toFixed(1))}h`;
  $("#stat-completed").textContent = completed.length;
}
function renderClasses() {
  const container = $("#class-list");
  if (!classes.length) {
    container.innerHTML = '<div class="empty-state">No classes yet. Add your first class above.</div>';
    return;
  }
  container.innerHTML = classes.map((item) => `
    <div class="class-item">
      <span class="class-dot" style="background:${escapeHtml(item.color)}"></span>
      <div class="class-info"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.instructor || "No instructor added")}</small></div>
      <button class="tiny-button" data-edit-class="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">✎</button>
      <button class="tiny-button" data-delete-class="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">×</button>
    </div>`).join("");
}
function renderAssignments() {
  const filter = $("#assignment-filter").value;
  const visible = assignments.filter((item) => {
    if (filter === "open") return !item.completed;
    if (filter === "completed") return Boolean(item.completed);
    return true;
  });
  const container = $("#assignment-list");
  if (!visible.length) {
    container.innerHTML = '<div class="empty-state">Nothing here yet. Add an assignment to get started.</div>';
    return;
  }
  container.innerHTML = visible.map((item) => `
    <div class="assignment-item">
      <button class="check-button ${item.completed ? "checked" : ""}" data-toggle="${item.id}" aria-label="${item.completed ? "Mark incomplete" : "Mark complete"}">${item.completed ? "✓" : ""}</button>
      <div class="assignment-info">
        <strong class="${item.completed ? "completed-text" : ""}">${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.class_name || "No class")} · Due ${prettyDate(item.due_date)}</small>
      </div>
      <div class="assignment-meta"><strong>${Number(item.estimated_hours)}h</strong><small>estimated</small></div>
      <div class="item-actions">
        <button class="tiny-button" data-edit-assignment="${item.id}" aria-label="Edit assignment">✎</button>
        <button class="tiny-button" data-delete-assignment="${item.id}" aria-label="Delete assignment">×</button>
      </div>
    </div>`).join("");
}
function updateClassOptions(selected = "") {
  $("#assignment-class").innerHTML = '<option value="">No class selected</option>' +
    classes.map((item) => `<option value="${item.id}" ${String(item.id) === String(selected) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
}
function openAssignment(item = null) {
  $("#assignment-form").reset();
  $("#assignment-error").textContent = "";
  $("#assignment-id").value = item?.id || "";
  $("#assignment-modal-title").textContent = item ? "Edit assignment" : "Add an assignment";
  $("#assignment-title").value = item?.title || "";
  $("#assignment-due").value = item?.due_date || localDateString();
  $("#assignment-hours").value = item?.estimated_hours ?? 1;
  $("#assignment-notes").value = item?.notes || "";
  updateClassOptions(item?.class_id || "");
  assignmentDialog.showModal();
  $("#assignment-title").focus();
}
function openClass(item = null) {
  $("#class-form").reset();
  $("#class-error").textContent = "";
  $("#class-id").value = item?.id || "";
  $("#class-modal-title").textContent = item ? "Edit class" : "Add a class";
  $("#class-name").value = item?.name || "";
  $("#class-instructor").value = item?.instructor || "";
  $("#class-color").value = item?.color || "#647bff";
  classDialog.showModal();
  $("#class-name").focus();
}
$("#add-assignment").addEventListener("click", () => openAssignment());
$("#welcome-add").addEventListener("click", () => openAssignment());
$("#add-class").addEventListener("click", () => openClass());
$("#assignment-filter").addEventListener("change", renderAssignments);
document.querySelectorAll(".close-dialog").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
$("#assignment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#assignment-id").value;
  const body = {
    title: $("#assignment-title").value,
    class_id: $("#assignment-class").value || null,
    due_date: $("#assignment-due").value,
    estimated_hours: Number($("#assignment-hours").value),
    notes: $("#assignment-notes").value
  };
  try {
    await request(id ? `/assignments/${id}` : "/assignments", {
      method: id ? "PUT" : "POST", body: JSON.stringify(body)
    });
    assignmentDialog.close();
    await loadData();
    showToast(id ? "Assignment updated." : "Assignment added.");
  } catch (error) { $("#assignment-error").textContent = error.message; }
});
$("#class-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("#class-id").value;
  const body = {
    name: $("#class-name").value,
    instructor: $("#class-instructor").value,
    color: $("#class-color").value
  };
  try {
    await request(id ? `/classes/${id}` : "/classes", {
      method: id ? "PUT" : "POST", body: JSON.stringify(body)
    });
    classDialog.close();
    await loadData();
    showToast(id ? "Class updated." : "Class added.");
  } catch (error) { $("#class-error").textContent = error.message; }
});
document.addEventListener("click", async (event) => {
  const toggle = event.target.closest("[data-toggle]");
  const editAssignment = event.target.closest("[data-edit-assignment]");
  const deleteAssignment = event.target.closest("[data-delete-assignment]");
  const editClass = event.target.closest("[data-edit-class]");
  const deleteClass = event.target.closest("[data-delete-class]");
  try {
    if (toggle) {
      await request(`/assignments/${toggle.dataset.toggle}/complete`, { method: "PATCH" });
      await loadData();
    } else if (editAssignment) {
      openAssignment(assignments.find((item) => item.id === Number(editAssignment.dataset.editAssignment)));
    } else if (deleteAssignment) {
      if (!confirm("Delete this assignment?")) return;
      await request(`/assignments/${deleteAssignment.dataset.deleteAssignment}`, { method: "DELETE" });
      await loadData();
      showToast("Assignment deleted.");
    } else if (editClass) {
      openClass(classes.find((item) => item.id === Number(editClass.dataset.editClass)));
    } else if (deleteClass) {
      if (!confirm("Delete this class? Assignments will remain, but become unassigned.")) return;
      await request(`/classes/${deleteClass.dataset.deleteClass}`, { method: "DELETE" });
      await loadData();
      showToast("Class deleted.");
    }
  } catch (error) { showToast(error.message); }
});
setToday();
loadData();
