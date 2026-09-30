const STORAGE_KEY = "todo-app-tasks";
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const els = {
  liveClock: document.getElementById("liveClock"),
  monthTitle: document.getElementById("monthTitle"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedLabel: document.getElementById("selectedLabel"),
  jumpToday: document.getElementById("jumpToday"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  taskDateTitle: document.getElementById("taskDateTitle"),
  taskCount: document.getElementById("taskCount"),
  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskPriority: document.getElementById("taskPriority"),
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
};

let today = startOfDay(new Date());
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = formatDate(today);
let tasks = loadTasks();

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function tasksForDate(iso) {
  return tasks.filter((task) => task.date === iso);
}

function monthDots() {
  const dots = new Map();
  for (const task of tasks) {
    const date = parseDate(task.date);
    if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) continue;
    const current = dots.get(task.date) || "none";
    if (task.priority === "urgent") {
      dots.set(task.date, "urgent");
    } else if (current !== "urgent") {
      dots.set(task.date, "normal");
    }
  }
  return dots;
}

function renderCalendar() {
  const first = new Date(viewYear, viewMonth, 1);
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const todayIso = formatDate(today);
  const dots = monthDots();

  els.monthTitle.textContent = `${viewYear}. ${String(viewMonth + 1).padStart(2, "0")}`;
  els.calendarGrid.replaceChildren();

  for (let i = 0; i < mondayIndex; i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    empty.setAttribute("aria-hidden", "true");
    els.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const iso = formatDate(new Date(viewYear, viewMonth, day));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-cell";
    btn.dataset.date = iso;
    if (iso === todayIso) btn.classList.add("today");
    if (iso === selectedDate) btn.classList.add("selected");

    const num = document.createElement("span");
    num.className = "day-num";
    num.textContent = String(day);
    btn.appendChild(num);

    const mark = dots.get(iso);
    if (mark) {
      const dot = document.createElement("span");
      dot.className = mark === "urgent" ? "day-dot urgent" : "day-dot";
      btn.appendChild(dot);
    }

    btn.addEventListener("click", () => {
      selectedDate = iso;
      render();
    });

    els.calendarGrid.appendChild(btn);
  }
}

function renderTasks() {
  const date = parseDate(selectedDate);
  const dayTasks = tasksForDate(selectedDate);
  const openCount = dayTasks.filter((task) => !task.done).length;

  els.selectedLabel.textContent = selectedDate === formatDate(today) ? "Today" : selectedDate;
  els.taskDateTitle.textContent = `${selectedDate.replaceAll("-", ".")} ${WEEKDAY_LABELS[date.getDay()]}`;
  els.taskCount.textContent = openCount ? `남은 할일 ${openCount}` : "완료";

  els.taskList.replaceChildren();
  els.emptyState.hidden = dayTasks.length > 0;

  const sorted = [...dayTasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return a.priority === "urgent" ? -1 : 1;
    return 0;
  });

  for (const task of sorted) {
    const li = document.createElement("li");
    li.className = task.done ? "task-item done" : "task-item";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = task.done;
    check.setAttribute("aria-label", `${task.title} 완료`);
    check.addEventListener("change", () => {
      task.done = check.checked;
      saveTasks();
      render();
    });

    const title = document.createElement("span");
    title.className = task.priority === "urgent" ? "task-title urgent" : "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const tag = document.createElement("span");
    tag.className = task.priority === "urgent" ? "priority-tag urgent" : "priority-tag";
    tag.textContent = task.priority === "urgent" ? "긴급" : "보통";

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.textContent = "삭제";
    del.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
    });

    meta.append(tag, del);
    li.append(check, title, meta);
    els.taskList.appendChild(li);
  }
}

function render() {
  renderCalendar();
  renderTasks();
}

els.prevMonth.addEventListener("click", () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar();
});

els.nextMonth.addEventListener("click", () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar();
});

els.jumpToday.addEventListener("click", () => {
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  selectedDate = formatDate(today);
  render();
});

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.taskTitle.value.trim();
  if (!title) return;

  tasks.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: selectedDate,
    title,
    priority: els.taskPriority.value === "urgent" ? "urgent" : "normal",
    done: false,
  });

  saveTasks();
  els.taskForm.reset();
  els.taskPriority.value = "normal";
  els.taskTitle.focus();
  render();
});

function tickClock() {
  const now = new Date();
  const clockText = formatTime(now);
  els.liveClock.textContent = clockText;
  els.liveClock.setAttribute("datetime", now.toISOString());

  const todayIso = formatDate(startOfDay(now));
  if (todayIso !== formatDate(today)) {
    today = startOfDay(now);
    render();
  }
}

tickClock();
setInterval(tickClock, 1000);

render();
els.taskTitle.focus();
