// js/services/leaveService.js

const LeaveService = {
  // ADMIN: all leaves
  async getAll() {
    return api.get("/leaves");
  },

  // ADMIN: approve leave
  async approve(id, adminRemark = "") {
    return api.put(`/leaves/${id}/approve`, { adminRemark });
  },

  // ADMIN: reject leave
  async reject(id, adminRemark = "") {
    return api.put(`/leaves/${id}/reject`, { adminRemark });
  },

  // ADMIN: delete leave
  async delete(id) {
    return api.delete(`/leaves/${id}`);
  },

  // STUDENT: my leaves
  async getMy() {
    return api.get("/leaves/my");
  },

  // STUDENT: create leave
  async create(data) {
    return api.post("/leaves", data);
  },
};

window.LeaveService = LeaveService;
