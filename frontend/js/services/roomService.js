// frontend/js/services/roomService.js — FIXED (no more toUpperCase crash)

const RoomService = {
  async getAll() {
    return api.get("/rooms");
  },

  async create(data) {
    if (!data || !data.roomId) {
      throw new Error("Room ID is required.");
    }
    if (!data.capacity || Number(data.capacity) <= 0) {
      throw new Error("Capacity must be a positive number.");
    }

    // SAFEST POSSIBLE NORMALIZATION
    const rid = String(data.roomId || "")
      .trim()
      .toUpperCase();

    return api.post("/rooms", {
      roomId: rid,
      capacity: Number(data.capacity),
    });
  },

  async update(id, data) {
    if (!id) throw new Error("Room id required.");
    return api.put(`/rooms/${id}`, data);
  },

  async delete(id) {
    if (!id) throw new Error("Room id required.");
    return api.delete(`/rooms/${id}`);
  },
};

window.RoomService = RoomService;
