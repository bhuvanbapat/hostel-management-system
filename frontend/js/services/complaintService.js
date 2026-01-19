// frontend/js/services/complaintService.js — FIXED

const ComplaintService = {
  // STUDENT submit
  async submit(issue) {
    if (!issue || !String(issue).trim()) {
      throw new Error("Complaint cannot be empty.");
    }
    return api.post("/complaints", { issue: String(issue).trim() });
  },

  // alias used by student.js
  async create(data) {
    if (!data || !data.issue) {
      throw new Error("Complaint cannot be empty.");
    }
    return this.submit(data.issue);
  },

  async getMy() {
    return api.get("/complaints/my");
  },

  // ADMIN
  async getAll() {
    return api.get("/complaints");
  },

  async resolve(id) {
    return api.put(`/complaints/${id}/resolve`);
  },

  async delete(id) {
    return api.delete(`/complaints/${id}`);
  },
};

window.ComplaintService = ComplaintService;
