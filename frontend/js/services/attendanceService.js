const AttendanceService = {
  async getMyLogs() {
    return api.get("/attendance/me");
  },
  async getTodayStatus() {
    return api.get("/attendance/today");
  },
  async checkin() {
    return api.post("/attendance/checkin");
  },
  async checkout() {
    return api.post("/attendance/checkout");
  }
};

window.AttendanceService = AttendanceService;
