// js/services/profileService.js

window.ProfileService = {
  // GET FULL PROFILE
  async get() {
    return api.get("/students/me");
  },

  // UPDATE BASIC PROFILE FIELDS
  async update(data) {
    return api.put("/students/me", data);
  },

  // CHANGE PASSWORD
  async changePassword(oldPassword, newPassword) {
    return api.put("/auth/change-password", {
      oldPassword,
      newPassword,
    });
  },

  // (Profile photo upload removed: now admin-only)
};
