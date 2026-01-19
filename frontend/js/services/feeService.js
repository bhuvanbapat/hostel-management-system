// js/services/feeService.js

const FeeService = {
  // ADMIN: all fees (used in admin fees section)
  async getAll() {
    return api.get("/fees");
  },

  // STUDENT: my fees (used in student fees section)
  async getMy() {
    return api.get("/fees/my");
  },

  // ADMIN: create fee
  async create(data) {
    return api.post("/fees", data);
  },

  // ADMIN: generate monthly fees
  async generate(body = {}) {
    return api.post("/fees/generate", body);
  },

  // ADMIN: toggle fee status paid/pending
  async toggleStatus(id) {
    return api.put(`/fees/${id}/toggle-status`);
  },

  // ADMIN: update fee
  async update(id, data) {
    return api.put(`/fees/${id}`, data);
  },

  // ADMIN: delete fee
  async delete(id) {
    return api.delete(`/fees/${id}`);
  },
};

window.FeeService = FeeService;
