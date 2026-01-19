// js/services/authService.js

// Attach to window to ensure global availability
window.AuthService = {
  API_BASE_URL: "http://localhost:3000/api",

  async login(username, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.token) {
        localStorage.setItem("authToken", data.token);
        return { success: true, message: "Login successful!", token: data.token };
      } else {
        return { success: false, message: "Login failed: No token received." };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  },

  logout() {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
  },

  getToken() {
    return localStorage.getItem("authToken");
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  // Decode JWT payload (used in admin.js / student.js)
  decodeToken() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split(".")[1];
      const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      return JSON.parse(json);
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  },

  // Change password using backend route
  async changePassword(oldPassword, newPassword) {
    try {
      const res = await api.put("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      return {
        success: true,
        message: res.message || "Password updated successfully.",
      };
    } catch (err) {
      console.error("Change password error:", err);
      return { success: false, message: err.message || "Error updating password." };
    }
  },
};
