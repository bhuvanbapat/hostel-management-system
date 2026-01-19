// ==========================================================
// ui.js — UIManager: toast, alerts, confirm, loading
//         + Theme engine (dark / light with persistence)
// ==========================================================

window.UIManager = {
  // -----------------------------
  // LOADING OVERLAY
  // -----------------------------
  showLoading(message = "Loading...") {
    let overlay = document.getElementById("global-loading");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "global-loading";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(5,7,17,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999",
      backdropFilter: "blur(6px)",
    });

    const box = document.createElement("div");
    box.textContent = message;
    Object.assign(box.style, {
      padding: "14px 20px",
      borderRadius: "16px",
      background: "rgba(15,23,42,0.9)",
      border: "1px solid rgba(255,255,255,0.25)",
      color: "#fff",
      fontSize: "0.95rem",
    });

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  },

  hideLoading() {
    const overlay = document.getElementById("global-loading");
    if (overlay) overlay.remove();
  },

  // -----------------------------
  // TOAST
  // -----------------------------
  showToast(message, type = "info") {
    const old = document.querySelector(".toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  },

  // -----------------------------
  // ALERT MODAL
  // -----------------------------
  showAlert(title, message) {
    return new Promise((resolve) => {
      const modal = this._createModalBase();

      const content = document.createElement("div");
      content.className = "modal-content";
      content.innerHTML = `
        <span class="modal-close" style="float:right;cursor:pointer;">&times;</span>
        <h2>${title}</h2>
        <p style="margin-top:10px;">${message}</p>
        <button class="btn-primary" style="margin-top:14px;">OK</button>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      const close = () => {
        modal.remove();
        resolve(true);
      };

      content.querySelector(".modal-close").onclick = close;
      content.querySelector("button").onclick = close;
    });
  },

  // -----------------------------
  // CONFIRM MODAL
  // -----------------------------
  showConfirm(title, message) {
    return new Promise((resolve) => {
      const modal = this._createModalBase();

      const content = document.createElement("div");
      content.className = "modal-content";
      content.innerHTML = `
        <span class="modal-close" style="float:right;cursor:pointer;">&times;</span>
        <h2>${title}</h2>
        <p style="margin-top:10px;">${message}</p>
        <div style="margin-top:16px;display:flex;gap:8px;">
          <button class="btn-primary">Yes</button>
          <button class="btn-secondary">No</button>
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      const close = (value) => {
        modal.remove();
        resolve(value);
      };

      content.querySelector(".modal-close").onclick = () => close(false);
      content.querySelector(".btn-primary").onclick = () => close(true);
      content.querySelector(".btn-secondary").onclick = () => close(false);
    });
  },

  // -----------------------------
  // INTERNAL: MODAL BASE
  // -----------------------------
  _createModalBase() {
    const modal = document.createElement("div");
    modal.className = "modal fade-in-up"; // Added animation class
    return modal;
  },
};

// ==========================================================
// THEME ENGINE (DARK / LIGHT MODE WITH PERSISTENCE)
// Robust handling for Enterprise/Premium feel
// ==========================================================

window.Theme = {
  get current() {
    return localStorage.getItem("hms-theme") || "light"; // Default to LIGHT for institutional feel
  },

  set current(value) {
    localStorage.setItem("hms-theme", value);
    // Dispatch event for other components if needed
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: value }));
  },

  init() {
    // Immediate application
    this.applyTheme(this.current);
    
    // Defer button update to ensure DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateToggleButtons());
    } else {
      this.updateToggleButtons();
    }
  },

  toggle() {
    const newTheme = this.current === "dark" ? "light" : "dark";
    this.current = newTheme;
    this.applyTheme(newTheme);
    this.updateToggleButtons();
    
    // Optional: Toast feedback
    if (window.UIManager) {
      UIManager.showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
    }
  },

  applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    
    if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    }
  },

  updateToggleButtons() {
    // Select all potential toggle buttons (admin, student, floating)
    const toggleBtns = document.querySelectorAll("#themeToggle, .theme-toggle-enterprise");
    
    toggleBtns.forEach(btn => {
      // Prevent multiple binding
      if (!btn.dataset.clickBound) {
        btn.dataset.clickBound = "true";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggle();
        });
      }

      // Update Icon
      const icon = btn.querySelector(".theme-icon");
      if (icon) {
        // Sun for Dark mode (click to switch to light), Moon for Light mode
        icon.textContent = this.current === "dark" ? "☀️" : "🌙"; 
      }
      
      // Update Text if exists
      const textSpan = btn.querySelector("span:not(.theme-icon)");
      if (textSpan && !textSpan.classList.contains('hidden')) {
        textSpan.textContent = this.current === "dark" ? "Light" : "Dark";
      }
    });
  }
};

// 1. FLASH PREVENTION: Apply immediately before DOM
(function () {
  const saved = localStorage.getItem("hms-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  if (saved === 'dark') document.documentElement.classList.add('theme-dark');
})();

// 2. INIT: Run initialization logic
Theme.init();

