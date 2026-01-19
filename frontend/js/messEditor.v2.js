// js/messEditor.js

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggle = document.getElementById("themeToggle");

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      AuthService.logout();
      window.location.href = "index.html";
    };
  }

  // Theme toggle handler
  if (themeToggle) {
    themeToggle.onclick = () => {
      Theme.toggle();
    };
  }


  // Auth check (admin only)
  if (!AuthService.isLoggedIn()) {
    UIManager.showToast("Session expired. Login again.", "error");
    return (window.location.href = "admin-login.html");
  }

  const decoded = AuthService.decodeToken();
  const user = decoded && decoded.user;
  if (!user || user.role !== "admin") {
    AuthService.logout();
    return (window.location.href = "index.html");
  }

  initMessEditor();
});

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEALS = ["breakfast", "lunch", "dinner"];

// You can tweak this list anytime
const PRESET_FOODS = [
  "Idli",
  "Vada",
  "Dosa",
  "Upma",
  "Poori",
  "Chapati",
  "Rice",
  "Sambar",
  "Rasam",
  "Veg Curry",
  "Paneer Curry",
  "Dal",
  "Curd",
  "Veg Biryani",
  "Egg Curry",
  "Chicken Curry",
  "Pulao",
  "Salad",
  "Fruits",
  "Curd Rice",
  "Noodles",
  "Pasta",
  "Tea",
  "Coffee",
  "Milk",
];

let menuData = null; // { week: { Monday: { breakfast: [], lunch: [], dinner: [] }, ... } }
let currentDay = null;
let currentMealKey = null;

async function initMessEditor() {
  const root = document.getElementById("mess-editor-root");
  if (!root) return;

  UIManager.showLoading("Loading mess menu...");

  try {
    const existing = await MessMenuService.getMenu().catch(() => null);
    menuData = normalizeMenu(existing);

    root.innerHTML = buildEditorLayout();
    wireEditorEvents();
    renderGridFromMenu();
  } catch (err) {
    console.error(err);
    UIManager.showToast(err.message || "Error loading mess menu.", "error");
  }

  UIManager.hideLoading();
}

function createEmptyMenu() {
  const week = {};
  DAYS.forEach((day) => {
    week[day] = { breakfast: [], lunch: [], dinner: [] };
  });
  return { week };
}

// Make sure structure is always consistent + convert strings -> arrays if needed
function normalizeMenu(raw) {
  if (!raw || typeof raw !== "object") {
    return createEmptyMenu();
  }

  const baseWeek = raw.week && typeof raw.week === "object" ? raw.week : {};
  const week = {};

  DAYS.forEach((day) => {
    const dayData = baseWeek[day] || {};
    week[day] = {};

    MEALS.forEach((meal) => {
      let value = dayData[meal];

      if (Array.isArray(value)) {
        week[day][meal] = value.filter(Boolean);
      } else if (typeof value === "string") {
        const arr = value
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        week[day][meal] = arr;
      } else {
        week[day][meal] = [];
      }
    });
  });

  return { week };
}

function buildEditorLayout() {
  return `
    <div class="card">
      <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h3>🍽️ Weekly Mess Menu Editor</h3>
          <p class="text-sm text-muted">Select a meal slot to edit its items.</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" id="resetWeekBtn">Reset Week</button>
          <button class="btn-primary" id="saveAllBtn">💾 Save Changes</button>
        </div>
      </div>

      <div class="mess-editor-columns">
        <!-- LEFT: Days Grid -->
        <div class="mess-days-grid-editor">
          ${DAYS.map(day => `
            <div class="mess-editor-day-card" data-day="${day}">
              <div class="mess-day-header">${day}</div>
              <div class="mess-day-body">
                ${MEALS.map(meal => `
                  <div class="mess-meal-slot-editor" data-day="${day}" data-meal="${meal}">
                    <div class="meal-label">${capitalize(meal)}</div>
                    <div class="meal-content" data-label="${day}-${meal}">-</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- RIGHT: Editor Panel (Sticky) -->
        <div class="mess-editor-sidebar">
          <div class="card-inner sticky-editor">
            <h3 id="currentSlotTitle" class="text-lg font-semibold mb-2">Select a slot</h3>
            <p class="text-xs text-muted mb-3">Click a meal box on the left to edit.</p>
            
            <div id="foodChipContainer" class="food-chip-grid">
              <p class="text-sm text-muted italic">No slot selected.</p>
            </div>

            <div class="mt-4 flex gap-2 flex-wrap">
              <button class="btn-primary w-full" id="saveMealBtn" disabled>Update Slot</button>
              <button class="btn-secondary w-full" id="clearMealBtn" disabled>Clear Slot</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireEditorEvents() {
  const container = document.querySelector(".mess-days-grid-editor");
  if (container) {
    container.addEventListener("click", (e) => {
      const slot = e.target.closest(".mess-meal-slot-editor");
      if (!slot) return;

      const day = slot.getAttribute("data-day");
      const meal = slot.getAttribute("data-meal");
      if (day && meal) selectSlot(day, meal);
    });
  }

  const saveAllBtn = document.getElementById("saveAllBtn");
  if (saveAllBtn) {
    saveAllBtn.onclick = saveWholeWeek;
  }

  const resetWeekBtn = document.getElementById("resetWeekBtn");
  if (resetWeekBtn) {
    resetWeekBtn.onclick = () => {
      const ok = confirm("Reset entire week to empty menu?");
      if (!ok) return;
      menuData = createEmptyMenu();
      renderGridFromMenu();
      if (currentDay && currentMealKey) renderCurrentSlotChips();
    };
  }

  const saveMealBtn = document.getElementById("saveMealBtn");
  if (saveMealBtn) {
    saveMealBtn.onclick = saveCurrentMeal;
  }

  const clearMealBtn = document.getElementById("clearMealBtn");
  if (clearMealBtn) {
    clearMealBtn.onclick = () => {
      if (!currentDay || !currentMealKey) return;
      menuData.week[currentDay][currentMealKey] = [];
      renderGridFromMenu();
      renderCurrentSlotChips();
    };
  }
}

function renderGridFromMenu() {
  if (!menuData || !menuData.week) return;

  DAYS.forEach((day) => {
    MEALS.forEach((meal) => {
      const slotContent = document.querySelector(
        `.meal-content[data-label="${day}-${meal}"]`
      );
      if (!slotContent) return;

      const items = menuData.week[day][meal] || [];
      if (Array.isArray(items) && items.length) {
        slotLabel.textContent = items.join(", ");
      } else {
        slotLabel.textContent = "-";
      }
    });
  });
}

function selectSlot(day, mealKey) {
  currentDay = day;
  currentMealKey = mealKey;

  // highlight active slot
  document.querySelectorAll(".mess-meal-slot-editor.selected").forEach((el) => {
    el.classList.remove("selected");
  });

  const slot = document.querySelector(
    `.mess-meal-slot-editor[data-day="${day}"][data-meal="${mealKey}"]`
  );
  if (slot) slot.classList.add("selected");

  const title = document.getElementById("currentSlotTitle");
  if (title) {
    title.textContent = `${day} – ${capitalize(mealKey)}`;
  }

  const saveMealBtn = document.getElementById("saveMealBtn");
  const clearMealBtn = document.getElementById("clearMealBtn");
  if (saveMealBtn) saveMealBtn.disabled = false;
  if (clearMealBtn) clearMealBtn.disabled = false;

  renderCurrentSlotChips();
}

function renderCurrentSlotChips() {
  const container = document.getElementById("foodChipContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!currentDay || !currentMealKey || !menuData) {
    container.innerHTML =
      '<p style="font-size:0.85rem;color:var(--text-muted);">Select a day and meal slot to edit.</p>';
    return;
  }

  const selectedItems = menuData.week[currentDay][currentMealKey] || [];

  PRESET_FOODS.forEach((item) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "food-pill";
    pill.textContent = item;

    if (selectedItems.includes(item)) {
      pill.classList.add("selected");
    }

    pill.onclick = () => {
      toggleFoodItem(item);
      pill.classList.toggle("selected");
    };

    container.appendChild(pill);
  });
}

function toggleFoodItem(item) {
  if (!currentDay || !currentMealKey || !menuData) return;

  const list = menuData.week[currentDay][currentMealKey];
  const idx = list.indexOf(item);
  if (idx === -1) {
    list.push(item);
  } else {
    list.splice(idx, 1);
  }
  // no immediate save; just update local state
  renderGridFromMenu();
}

async function saveCurrentMeal() {
  if (!menuData) return;
  UIManager.showLoading("Saving meal...");

  try {
    await MessMenuService.saveMenu(menuData);
    UIManager.showToast("Meal saved.", "success");
  } catch (err) {
    UIManager.showToast(err.message || "Error saving meal.", "error");
  }

  UIManager.hideLoading();
}

async function saveWholeWeek() {
  if (!menuData) return;
  UIManager.showLoading("Saving entire week...");

  try {
    await MessMenuService.saveMenu(menuData);
    UIManager.showToast("Mess menu updated.", "success");
  } catch (err) {
    UIManager.showToast(err.message || "Error saving menu.", "error");
  }

  UIManager.hideLoading();
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
