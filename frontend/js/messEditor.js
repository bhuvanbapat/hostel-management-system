// js/messEditor.js - Mess Menu Grid Editor (Redesigned)

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      AuthService.logout();
      window.location.href = "index.html";
    };
  }

  // Theme toggle is handled by ui.js - no duplicate needed


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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["breakfast", "lunch", "dinner"];

const PRESET_FOODS = [
  "Idli", "Vada", "Dosa", "Upma", "Poori", "Chapati", "Rice",
  "Sambar", "Rasam", "Veg Curry", "Paneer Curry", "Dal", "Curd",
  "Veg Biryani", "Egg Curry", "Chicken Curry", "Pulao", "Salad",
  "Fruits", "Curd Rice", "Noodles", "Pasta", "Tea", "Coffee", "Milk"
];

let menuData = null;
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

function normalizeMenu(raw) {
  if (!raw || typeof raw !== "object") return createEmptyMenu();

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
        week[day][meal] = value.split(",").map((x) => x.trim()).filter(Boolean);
      } else {
        week[day][meal] = [];
      }
    });
  });

  return { week };
}

function buildEditorLayout() {
  return `
    <div class="mess-editor-wrapper">
      <!-- LEFT: Grid Table -->
      <div class="mess-grid-section">
        <div class="mess-grid-header">
          <div>
            <h2 class="mess-grid-title">Mess Menu Grid Editor</h2>
            <p class="mess-grid-subtitle">Click any slot (day × meal) and choose items from the preset list on the right.</p>
          </div>
          <div class="mess-grid-actions">
            <button class="btn-secondary" id="resetWeekBtn">Reset Week</button>
            <button class="btn-primary" id="saveAllBtn">Save Whole Week</button>
          </div>
        </div>
        
        <div class="mess-grid-table-wrapper">
          <table class="mess-grid-table">
            <thead>
              <tr>
                <th class="col-day">Day</th>
                <th class="col-meal">Breakfast</th>
                <th class="col-meal">Lunch</th>
                <th class="col-meal">Dinner</th>
              </tr>
            </thead>
            <tbody>
              ${DAYS.map(day => `
                <tr>
                  <td class="day-cell"><strong>${day}</strong></td>
                  ${MEALS.map(meal => `
                    <td class="meal-cell" data-day="${day}" data-meal="${meal}">
                      <div class="meal-cell-content">
                        <span class="meal-items" data-label="${day}-${meal}">-</span>
                        <span class="meal-type">${capitalize(meal)}</span>
                      </div>
                      <button class="edit-btn" data-day="${day}" data-meal="${meal}">EDIT</button>
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- RIGHT: Editor Panel -->
      <div class="mess-editor-panel">
        <div class="editor-panel-card">
          <h3 id="currentSlotTitle" class="editor-panel-title">Select a Slot</h3>
          <p class="editor-panel-subtitle">Preset foods are shown below. Click to toggle selection.</p>
          
          <div id="foodChipContainer" class="food-chip-grid">
            <p class="no-selection-text">No slot selected.</p>
          </div>

          <div class="editor-panel-actions">
            <button class="btn-primary" id="saveMealBtn" disabled>Save This Meal</button>
            <button class="btn-secondary" id="clearMealBtn" disabled>Clear This Meal</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireEditorEvents() {
  // Click on meal cells or edit buttons
  document.querySelectorAll(".meal-cell, .edit-btn").forEach(el => {
    el.addEventListener("click", (e) => {
      const target = e.target.closest("[data-day][data-meal]");
      if (target) {
        selectSlot(target.getAttribute("data-day"), target.getAttribute("data-meal"));
      }
    });
  });

  // Save All button
  const saveAllBtn = document.getElementById("saveAllBtn");
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", saveWholeWeek);
  }

  // Reset Week button - clear all menu data (uses UI modal instead of native confirm)
  const resetWeekBtn = document.getElementById("resetWeekBtn");
  if (resetWeekBtn) {
    resetWeekBtn.addEventListener("click", async () => {
      const confirmed = await UIManager.showConfirm(
        "Reset Week",
        "Reset entire week to empty menu? This will clear all meals."
      );
      if (confirmed) {
        menuData = createEmptyMenu();
        renderGridFromMenu();
        if (currentDay && currentMealKey) {
          renderCurrentSlotChips();
        }
        UIManager.showToast("Week reset! Click 'Save Whole Week' to save.", "success");
      }
    });
  }

  document.getElementById("saveMealBtn")?.addEventListener("click", saveCurrentMeal);

  document.getElementById("clearMealBtn")?.addEventListener("click", () => {
    if (!currentDay || !currentMealKey) return;
    menuData.week[currentDay][currentMealKey] = [];
    renderGridFromMenu();
    renderCurrentSlotChips();
  });
}

function renderGridFromMenu() {
  if (!menuData || !menuData.week) return;

  DAYS.forEach((day) => {
    MEALS.forEach((meal) => {
      const slotContent = document.querySelector(`.meal-items[data-label="${day}-${meal}"]`);
      if (!slotContent) return;

      const items = menuData.week[day][meal] || [];
      slotContent.textContent = items.length > 0 ? items.join(", ") : "-";
    });
  });
}

function selectSlot(day, mealKey) {
  currentDay = day;
  currentMealKey = mealKey;

  // Remove previous selection
  document.querySelectorAll(".meal-cell.selected").forEach(el => el.classList.remove("selected"));

  // Add selection to current
  const cell = document.querySelector(`.meal-cell[data-day="${day}"][data-meal="${mealKey}"]`);
  if (cell) cell.classList.add("selected");

  // Update title
  const title = document.getElementById("currentSlotTitle");
  if (title) title.textContent = `${day} – ${capitalize(mealKey)}`;

  // Enable buttons
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
    container.innerHTML = '<p class="no-selection-text">Select a day and meal slot to edit.</p>';
    return;
  }

  const selectedItems = menuData.week[currentDay][currentMealKey] || [];

  PRESET_FOODS.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "food-chip";
    chip.textContent = item;

    if (selectedItems.includes(item)) {
      chip.classList.add("selected");
    }

    chip.onclick = () => {
      toggleFoodItem(item);
      chip.classList.toggle("selected");
    };

    container.appendChild(chip);
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
