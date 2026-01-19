// js/services/notificationService.js

const NotificationService = {
  // ADMIN: get all notifications
  async getAll() {
    return api.get("/notifications");
  },

  // STUDENT: get only my notifications
  async getMy() {
    return api.get("/notifications/my");
  },

  // Get unread count
  async getUnreadCount() {
    return api.get("/notifications/unread-count");
  },

  // Mark all as read
  async markAllRead() {
    return api.put("/notifications/mark-all-read");
  },

  // Mark single notification as read
  async markAsRead(id) {
    return api.put(`/notifications/${id}/read`);
  },

  // ADMIN: delete notification
  async delete(id) {
    return api.delete(`/notifications/${id}`);
  },
};

window.NotificationService = NotificationService;
