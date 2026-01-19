// ============================================================
// dashboardService.js — FINAL
// ============================================================

const DashboardService = {
  async getStats() {
    return api.get("/stats");
  },
};
