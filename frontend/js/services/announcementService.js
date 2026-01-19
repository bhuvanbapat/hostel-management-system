// =====================================================
// announcementService.js — unified API for announcements
// =====================================================

const AnnouncementService = {
  // Core getter: fetch all announcements
  async getAnnouncements() {
    try {
      return await api.get("/announcements");
    } catch (err) {
      console.error("Error fetching announcements:", err);
      return [];
    }
  },

  // Alias for admin.js which might call getAll()
  async getAll() {
    return this.getAnnouncements();
  },

  // Core creator: add new announcement
  async addAnnouncement(title, message) {
    if (!title || !title.trim()) {
      throw new Error("Announcement title cannot be empty.");
    }
    return api.post("/announcements", { title, message: message || "" });
  },

  // Alias for admin.js which might call create()
  async create(title, message) {
    return this.addAnnouncement(title, message);
  },

  // Delete announcement
  async delete(id) {
    return api.delete(`/announcements/${id}`);
  },
};
