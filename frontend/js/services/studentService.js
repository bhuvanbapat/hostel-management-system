// js/services/studentService.js

const StudentService = {
  // STUDENT: get own profile
  async getSelf() {
    return api.get("/students/me");
  },

  // STUDENT: update own profile
  async updateSelf(data) {
    return api.put("/students/me", data);
  },

  // ADMIN: --- keep existing admin functions ---
  async getAll() {
    return api.get("/students");
  },

  async create(data) {
    return api.post("/students", data);
  },

  async update(id, data) {
    return api.put(`/students/${id}`, data);
  },

  async delete(id) {
    return api.delete(`/students/${id}`);
  },
};
