// public/js/api.js
// ============================================================
// Centralized API Layer
// Handles fetch, auth token, headers, errors, toasts
// ============================================================

const api = {
  BASE_URL: "http://localhost:3000/api",

  // -----------------------------
  // GET
  // -----------------------------
  async get(path) {
    return this._request("GET", path);
  },

  // -----------------------------
  // POST (JSON)
  // -----------------------------
  async post(path, body) {
    return this._request("POST", path, body);
  },

  // -----------------------------
  // PUT (JSON)
  // -----------------------------
  async put(path, body) {
    return this._request("PUT", path, body);
  },

  // -----------------------------
  // DELETE
  // -----------------------------
  async delete(path) {
    return this._request("DELETE", path);
  },

  // -----------------------------
  // UPLOAD (FormData, e.g., profile photo)
  // -----------------------------
  async upload(path, formData) {
    const token = AuthService.getToken();

    const options = {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // IMPORTANT: do NOT set Content-Type here; browser will set multipart boundary
      },
      body: formData,
    };

    try {
      const response = await fetch(`${this.BASE_URL}${path}`, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.message || "Server error";
        UIManager.showToast(msg, "error");
        throw new Error(msg);
      }

      return data;
    } catch (err) {
      UIManager.showToast(err.message, "error");
      throw err;
    }
  },

  // -----------------------------
  // INTERNAL REQUEST HANDLER (JSON)
  // -----------------------------
  async _request(method, path, body = null, silent = false) {
    const token = AuthService.getToken();

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };

    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(`${this.BASE_URL}${path}`, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.message || "Server error";
        // Only show toast for user-facing errors (4xx), not server errors (5xx)
        // Also suppress certain background operations and room request status updates
        const isSilentPath = path.includes('/notifications') ||
          path.includes('/unread-count') ||
          path.includes('/mark-all-read') ||
          path.includes('/room-requests') && path.includes('/status');
        if (!silent && !isSilentPath && response.status < 500) {
          UIManager.showToast(msg, "error");
        } else {
          console.warn(`[API] ${method} ${path}:`, msg);
        }
        throw new Error(msg);
      }

      return data;
    } catch (err) {
      // Only show network errors if not silenced
      if (!silent && err.message !== "Failed to fetch") {
        // Already handled above, avoid duplicate toasts
      }
      throw err;
    }
  },


  async _requestFile(method, path, formData) {
    const token = AuthService.getToken();

    const options = {
      method,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData
    };

    const response = await fetch(`${this.BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data.message || "Upload error");
    return data;
  }

};
