// ============================================================
// MessMenuService.js
// Unified service for fetching and updating the weekly mess menu
// Works for both student + admin dashboard + grid editor
// ============================================================

const MessMenuService = {
  // -----------------------------------------------
  // FETCH WEEKLY MENU (student + admin)
  // -----------------------------------------------
  async getMenu() {
    return api.get("/settings/messMenu");
  },

  // -----------------------------------------------
  // SAVE ENTIRE MENU (used by admin grid editor)
  // -----------------------------------------------
  async saveMenu(fullMenu) {
    if (!fullMenu || !fullMenu.week) {
      throw new Error("Invalid menu format.");
    }
    return api.put("/settings/messMenu", fullMenu);
  },

  // -----------------------------------------------
  // UPDATE ONE DAY (Grid editor uses this)
  // day = "Monday"
  // mealsObj = { breakfast: [], lunch: [], dinner: [] }
  // -----------------------------------------------
  async updateDay(day, mealsObj) {
    if (!day || typeof day !== "string") {
      throw new Error("Day is required.");
    }

    const menu = await this.getMenu();

    if (!menu.week) menu.week = {};

    menu.week[day] = {
      ...(menu.week[day] || {}),
      ...mealsObj,
    };

    return this.saveMenu(menu);
  }
};

// expose globally
window.MessMenuService = MessMenuService;
