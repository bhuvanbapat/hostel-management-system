// js/services/roomRequestService.js

const RoomRequestService = {
  // STUDENT: Get my room requests
  async getMy() {
    return api.get("/room-requests/my");
  },

  // STUDENT: Create room request
  async create(data) {
    return api.post("/room-requests", data);
  },

  // ADMIN: Get all room requests
  async getAll() {
    return api.get("/room-requests");
  },

  // ADMIN: Update request status (approve/reject)
  async updateStatus(id, status, adminRemark = "") {
    return api.put(`/room-requests/${id}/status`, { status, adminRemark });
  },

  // ADMIN: Delete request
  async delete(id) {
    return api.delete(`/room-requests/${id}`);
  },
};

window.RoomRequestService = RoomRequestService;

