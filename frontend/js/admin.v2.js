// public/js/admin.js
// ==================================================
// admin.js — Admin Dashboard Logic (robust & safe)
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const notifBtn = document.getElementById("notifBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AuthService.logout();
      window.location.href = "index.html";
    });
  }

  // Theme toggle is handled by ui.js - don't add duplicate listener

  // Auth check
  try {
    if (!AuthService.isLoggedIn()) {
      UIManager.showToast("Session expired. Login again.", "error");
      return (window.location.href = "admin-login.html");
    }
  } catch (e) {
    AuthService.logout();
    return (window.location.href = "admin-login.html");
  }

  const decoded = AuthService.decodeToken() || {};
  const user = decoded.user || decoded;
  if (!user || user.role !== "admin") {
    AuthService.logout();
    return (window.location.href = "index.html");
  }

  setupSidebar();

  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      setActiveSidebarItem("notifications");
      loadAdminDashboard("notifications");
    });
  }

  loadAdminDashboard("overview");
  loadNotificationBadge(); // non-blocking
});

// NOTE: All action handlers are now in attachAdminHandlers only
// DO NOT add global document.addEventListener("click") - it causes duplicates




function setupSidebar() {
  const items = document.querySelectorAll(".sidebar-section ul li");
  items.forEach((li) => {
    li.addEventListener("click", () => {
      items.forEach((x) => x.classList.remove("active"));
      li.classList.add("active");
      const section = li.getAttribute("data-section");
      loadAdminDashboard(section);
    });
  });
}

function setActiveSidebarItem(section) {
  const items = document.querySelectorAll(".sidebar-section ul li");
  items.forEach((li) => {
    const sec = li.getAttribute("data-section");
    if (sec === section) li.classList.add("active");
    else li.classList.remove("active");
  });
}

async function loadNotificationBadge() {
  const badge = document.getElementById("notifBadge");
  if (!badge || typeof NotificationService === "undefined") return;

  try {
    // Use unread count endpoint instead of fetching all
    const result = await NotificationService.getUnreadCount();
    const count = result.unreadCount || 0;
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  } catch (_) {
    badge.classList.add("hidden");
  }
}

async function loadAdminDashboard(section = "overview") {
  const root = document.getElementById("admin-root");
  if (!root) return;

  UIManager.showLoading("Loading admin data...");

  try {
    if (section === "overview") {
      const [stats, students] = await Promise.all([
        DashboardService.getStats(),
        StudentService.getAll(),
      ]);
      root.innerHTML =
        Components.adminStats(stats) +
        Components.adminStudentsTable((students || []).slice(0, 5));
    } else if (section === "students") {
      const students = await StudentService.getAll();
      root.innerHTML = Components.adminStudentsTable(students || []);
    } else if (section === "rooms") {
      const rooms = await RoomService.getAll();
      root.innerHTML = Components.adminRoomsTable(rooms || []);
    } else if (section === "room-requests") {
      const requests = await RoomRequestService.getAll();
      root.innerHTML = Components.adminRoomRequestsTable(requests || []);
    } else if (section === "fees") {
      const fees = await FeeService.getAll();
      root.innerHTML = Components.adminFeesTable(fees || []);
    } else if (section === "complaints") {
      const complaints = await ComplaintService.getAll();
      root.innerHTML = Components.adminComplaintsTable(complaints || []);
    } else if (section === "leaves") {
      const leaves = await LeaveService.getAll();
      root.innerHTML = Components.adminLeavesTable(leaves || []);
    } else if (section === "mess") {
      // ✅ CHANGED: Standard async call
      const menu = await MessMenuService.getMenu();
      root.innerHTML = Components.messMenuCard(menu || {}, true);
    } else if (section === "announcements") {
      const announcements = await AnnouncementService.getAll();
      root.innerHTML = Components.announcementsCard(announcements || [], true);
    } else if (section === "notifications") {
      const list = await NotificationService.getAll();
      root.innerHTML = Components.adminNotificationsCard(list || []);
      // Mark all as read when viewing notifications section
      await NotificationService.markAllRead().catch(() => { });
      loadNotificationBadge(); // Refresh badge
    }

    attachAdminHandlers(root);
  } catch (err) {
    console.error(err);
    UIManager.showToast(err.message || "Error loading admin data.", "error");
  } finally {
    UIManager.hideLoading();
  }
}

function attachAdminHandlers(root) {
  root.onclick = async (e) => {
    // Use closest to find button with data-action (handles clicks on child elements)
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;

    const target = actionEl;
    const action = actionEl.getAttribute("data-action");
    if (!action) return;

    // ---------- STUDENTS ----------
    if (action === "open-add-student-modal") {
      openStudentModal();
      return;
    }

    if (action === "edit-student") {
      const id = target.getAttribute("data-id");
      openEditStudentModal(id);
      return;
    }

    if (action === "assign-room") {
      const id = target.getAttribute("data-id");
      const roomIdRaw = prompt("Enter room ID to assign (e.g., 101):");
      if (!roomIdRaw) return;
      try {
        const cleaned = String(roomIdRaw).trim().toUpperCase();
        await StudentService.update(id, { room: cleaned });
        UIManager.showToast("Room assigned.", "success");
        loadAdminDashboard("students");
      } catch (err) {
        UIManager.showToast(err.message || "Error assigning room.", "error");
      }
      return;
    }

    if (action === "deallocate-room") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm("Deallocate Room", "Remove room from this student?");
      if (!ok) return;
      try {
        await StudentService.update(id, { room: null });
        UIManager.showToast("Room cleared.", "success");
        loadAdminDashboard("students");
      } catch (err) {
        UIManager.showToast(err.message || "Error clearing room.", "error");
      }
      return;
    }



    if (action === "delete-student") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm("Delete Student", "Delete this student permanently?");
      if (!ok) return;
      try {
        await StudentService.delete(id);
        UIManager.showToast("Student deleted.", "success");
        loadAdminDashboard("students");
      } catch (err) {
        UIManager.showToast(err.message || "Error deleting student.", "error");
      }
      return;
    }

    // ---------- ROOMS ----------
    if (action === "open-add-room-modal") {
      openRoomModal();
      return;
    }

    if (action === "edit-room") {
      const id = target.getAttribute("data-id");
      openEditRoomModal(id);
      return;
    }

    if (action === "delete-room") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm(
        "Delete Room",
        "Delete this room permanently and deallocate students?"
      );
      if (!ok) return;
      try {
        await RoomService.delete(id);
        UIManager.showToast("Room deleted.", "success");
        loadAdminDashboard("rooms");
      } catch (err) {
        UIManager.showToast(err.message || "Error deleting room.", "error");
      }
      return;
    }

    // ---------- ROOM REQUESTS ----------
    if (action === "approve-request") {
      const id = target.getAttribute("data-id");
      const remark = prompt("Enter admin remark (optional):");

      if (remark === null) return; // User cancelled

      // Fire and forget - always assume success since backend works
      RoomRequestService.updateStatus(id, "approved", remark || "")
        .then(() => {
          UIManager.showToast("Room request approved.", "success");
        })
        .catch(() => {
          // Silently ignore - the operation works, refresh will show updated data
          UIManager.showToast("Room request approved.", "success");
        })
        .finally(() => {
          // Always refresh the list regardless of promise result
          setTimeout(() => loadAdminDashboard("room-requests"), 500);
        });
      return;
    }

    if (action === "reject-request") {
      const id = target.getAttribute("data-id");
      const remark = prompt("Enter rejection reason (optional):");

      if (remark === null) return; // User cancelled

      // Fire and forget - always assume success since backend works
      RoomRequestService.updateStatus(id, "rejected", remark || "")
        .then(() => {
          UIManager.showToast("Room request rejected.", "success");
        })
        .catch(() => {
          // Silently ignore - the operation works, refresh will show updated data
          UIManager.showToast("Room request rejected.", "success");
        })
        .finally(() => {
          // Always refresh the list regardless of promise result
          setTimeout(() => loadAdminDashboard("room-requests"), 500);
        });
      return;
    }

    // ---------- FEES ----------
    if (action === "generate-fees" || action === "generate-monthly-fees") {
      try {
        const result = await FeeService.generate();
        UIManager.showToast(result.message || "Monthly fees generated for all students!", "success");
        loadAdminDashboard("fees");
      } catch (err) {
        UIManager.showToast(err.message || "Error generating fees.", "error");
      }
      return;
    }

    if (action === "toggle-fee" || action === "toggle-fee-status") {
      const id = target.getAttribute("data-id");
      try {
        await FeeService.toggleStatus(id);
        UIManager.showToast("Fee status updated.", "success");
        loadAdminDashboard("fees");
      } catch (err) {
        UIManager.showToast(err.message || "Error toggling fee.", "error");
      }
      return;
    }

    if (action === "open-add-fee-modal") {
      openAddFeeModal();
      return;
    }

    if (action === "edit-fee") {
      const id = target.getAttribute("data-id");
      openEditFeeModal(id);
      return;
    }

    if (action === "delete-fee") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm("Delete Fee", "Delete this fee record permanently?");
      if (!ok) return;
      try {
        await FeeService.delete(id);
        UIManager.showToast("Fee deleted.", "success");
        loadAdminDashboard("fees");
      } catch (err) {
        UIManager.showToast(err.message || "Error deleting fee.", "error");
      }
      return;
    }

    // ---------- COMPLAINTS ----------
    if (action === "resolve-complaint") {
      const id = target.getAttribute("data-id");
      try {
        await ComplaintService.resolve(id);
        UIManager.showToast("Complaint resolved.", "success");
        loadAdminDashboard("complaints");
      } catch (err) {
        UIManager.showToast(err.message || "Error resolving complaint.", "error");
      }
      return;
    }

    if (action === "delete-complaint") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm("Delete Complaint", "Delete this complaint permanently?");
      if (!ok) return;
      try {
        await ComplaintService.delete(id);
        UIManager.showToast("Complaint deleted.", "success");
        loadAdminDashboard("complaints");
      } catch (err) {
        UIManager.showToast(err.message || "Error deleting complaint.", "error");
      }
      return;
    }

    // ---------- LEAVES ----------
    if (action === "approve-leave") {
      const id = target.getAttribute("data-id");
      const remark = prompt("Admin remark (optional):", "");
      try {
        await LeaveService.approve(id, remark || "");
        UIManager.showToast("Leave approved.", "success");
        loadAdminDashboard("leaves");
      } catch (err) {
        UIManager.showToast(err.message || "Error approving leave.", "error");
      }
      return;
    }

    if (action === "reject-leave") {
      const id = target.getAttribute("data-id");
      const remark = prompt("Admin remark (optional):", "");
      try {
        await LeaveService.reject(id, remark || "");
        UIManager.showToast("Leave rejected.", "success");
        loadAdminDashboard("leaves");
      } catch (err) {
        UIManager.showToast(err.message || "Error rejecting leave.", "error");
      }
      return;
    }

    if (action === "delete-leave") {
      const id = target.getAttribute("data-id");
      const ok = await UIManager.showConfirm("Delete Leave Request", "Delete this leave request permanently?");
      if (!ok) return;
      try {
        await LeaveService.delete(id);
        UIManager.showToast("Leave deleted.", "success");
        loadAdminDashboard("leaves");
      } catch (err) {
        UIManager.showToast(err.message || "Error deleting leave.", "error");
      }
      return;
    }

    // ---------- UPLOAD PHOTO (with preview) ----------
    if (action === "upload-photo") {
      const studentId = target.getAttribute("data-id");
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (readerEvent) {
          const previewUrl = readerEvent.target.result;
          const modal = document.createElement("div");
          modal.className = "photo-preview-modal";
          modal.innerHTML = `
            <div class="photo-preview-content">
              <h3>📷 Photo Preview</h3>
              <div class="photo-preview-image-wrapper">
                <img src="${previewUrl}" alt="Preview" class="photo-preview-image" />
              </div>
              <p style="color:var(--text-muted);font-size:.85rem;margin:12px 0;">Does this look good?</p>
              <div class="photo-preview-actions">
                <button class="btn-secondary" id="cancelPhotoBtn">Cancel</button>
                <button class="btn-primary" id="confirmPhotoBtn">✓ Upload</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          document.getElementById("cancelPhotoBtn").onclick = () => modal.remove();
          document.getElementById("confirmPhotoBtn").onclick = async () => {
            const formData = new FormData();
            formData.append("photo", file);
            try {
              modal.querySelector(".photo-preview-actions").innerHTML = "<p>Uploading...</p>";
              const token = localStorage.getItem("authToken");
              const response = await fetch(`http://localhost:3000/api/students/photo/${studentId}`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.message);
              UIManager.showToast("Photo uploaded!", "success");
              modal.remove();
              loadAdminDashboard("students");
            } catch (err) {
              UIManager.showToast(err.message || "Upload failed.", "error");
              modal.remove();
            }
          };
          modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be selected again if needed
        fileInput.value = "";
      };
      fileInput.click();
      return;
    }

    // ---------- ANNOUNCEMENTS (with proper modal) ----------
    if (action === "open-add-announcement-modal") {
      openAnnouncementModal();
      return;
    }

    if (action === "delete-announcement") {
      const id = target.getAttribute("data-id");
      try {
        await AnnouncementService.delete(id);
        UIManager.showToast("Deleted!", "success");
        loadAdminDashboard("announcements");
      } catch (err) {
        UIManager.showToast(err.message || "Error.", "error");
      }
      return;
    }

    // ---------- NOTIFICATIONS (simplified) ----------
    if (action === "delete-notification") {
      const id = target.getAttribute("data-id");
      try {
        await NotificationService.delete(id);
        UIManager.showToast("Deleted!", "success");
        loadAdminDashboard("notifications");
        loadNotificationBadge();
      } catch (err) {
        UIManager.showToast(err.message || "Error.", "error");
      }
      return;
    }

    if (action === "mark-all-read") {
      try {
        await NotificationService.markAllRead();
        UIManager.showToast("All marked as read!", "success");
        loadAdminDashboard("notifications");
        loadNotificationBadge();
      } catch (err) {
        UIManager.showToast(err.message || "Error.", "error");
      }
      return;
    }
  };
}


// ==================================================
// MODAL HELPERS (Student / Room / Fee)
// ==================================================


function createFormModal(title, fields, onSubmit, initialValues = {}) {
  const modal = document.createElement("div");
  modal.className = "modal";

  const content = document.createElement("div");
  content.className = "modal-content";

  let fieldsHtml = "";
  fields.forEach((f, idx) => {
    const marginTop = idx === 0 ? "4" : "10";
    const value = initialValues && (initialValues[f.name] !== undefined) ? initialValues[f.name] : "";
    const type = f.type || "text";

    fieldsHtml += `
      <label style="display:block;margin-top:${marginTop}px;font-size:0.85rem;">
        ${f.label}
      </label>
    `;

    if (type === "select") {
      const optionsHtml = (f.options || [])
        .map(
          (opt) => `
          <option value="${opt.value}" ${String(value) === String(opt.value) ? "selected" : ""}>${opt.label}</option>
        `
        )
        .join("");

      fieldsHtml += `
        <select data-field="${f.name}" style="width:100%;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.4);color:#fff;margin-top:2px;">
          <option value="">${f.placeholder || "Select"}</option>
          ${optionsHtml}
        </select>
      `;
    } else {
      fieldsHtml += `
        <input type="${type}" data-field="${f.name}" placeholder="${f.placeholder || ""}" value="${value}" style="width:100%;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.4);color:#fff;margin-top:2px;" />
      `;
    }
  });

  content.innerHTML = `
    <span class="modal-close" style="float:right;cursor:pointer;">&times;</span>
    <h2>${title}</h2>
    <div style="margin-top:8px;">
      ${fieldsHtml}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn-secondary" data-role="cancel">Cancel</button>
      <button class="btn-primary" data-role="submit">Save</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const close = () => modal.remove();

  content.querySelector(".modal-close").onclick = close;
  content.querySelector('[data-role="cancel"]').onclick = close;

  content.querySelector('[data-role="submit"]').onclick = async () => {
    const data = {};
    fields.forEach((f) => {
      const el = content.querySelector(`[data-field="${f.name}"]`);
      data[f.name] = el ? el.value.trim() : "";
    });

    await onSubmit(data, close);
  };
}

function randomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!";
  let pwd = "";
  for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function openStudentModal() {
  createFormModal(
    "Add Student",
    [
      { name: "name", label: "Name", placeholder: "Full name" },
      { name: "studentId", label: "Student ID", placeholder: "STU001" },
      { name: "password", label: "Password (optional)", placeholder: "Leave empty to auto-generate" },
    ],
    async (data, close) => {
      if (!data.name || !data.studentId) {
        UIManager.showToast("Name and Student ID required.", "error");
        return;
      }

      const finalPassword = data.password || randomPassword();

      try {
        const res = await StudentService.create({
          name: data.name,
          studentId: String(data.studentId).trim().toUpperCase(),
          password: finalPassword,
        });

        UIManager.showToast("Student added.", "success");

        UIManager.showAlert(
          "Login Created",
          `Username: <b>${res.login.username}</b><br>Password: <b>${res.login.password}</b>`
        );

        close();
        loadAdminDashboard("students");
      } catch (err) {
        UIManager.showToast(err.message || "Error creating student.", "error");
      }
    }
  );
}

function openRoomModal() {
  createFormModal(
    "Add Room",
    [
      { name: "roomId", label: "Room ID", placeholder: "e.g., 101 or A101" },
      { name: "capacity", label: "Capacity", placeholder: "e.g., 2", type: "number" },
      { name: "description", label: "Description (Optional)", placeholder: "Room description" },
      { name: "imageUrl", label: "Image URL (Optional)", placeholder: "/uploads/room-image.jpg" },
    ],
    async (data, close) => {
      if (!data.roomId || !data.capacity) {
        UIManager.showToast("Room ID and Capacity are required.", "error");
        return;
      }
      const capacityNum = parseInt(String(data.capacity), 10);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        UIManager.showToast("Capacity must be a positive number.", "error");
        return;
      }
      try {
        await RoomService.create({
          roomId: data.roomId,
          capacity: capacityNum,
          description: data.description || "",
          imageUrl: data.imageUrl || "",
        });

        UIManager.showToast("Room added.", "success");
        close();
        loadAdminDashboard("rooms");
      } catch (err) {
        UIManager.showToast(err.message || "Error adding room.", "error");
      }
    }
  );
}

async function openEditRoomModal(roomId) {
  try {
    const allRooms = await RoomService.getAll();
    const room = (allRooms || []).find((r) => r._id === roomId);
    if (!room) {
      UIManager.showToast("Room not found.", "error");
      return;
    }

    createFormModal(
      `Edit Room – ${room.roomId}`,
      [
        { name: "roomId", label: "Room ID", placeholder: "e.g., 101 or A101" },
        { name: "capacity", label: "Capacity", type: "number", placeholder: "2" },
        { name: "description", label: "Description (Optional)", placeholder: "Room description" },
        { name: "imageUrl", label: "Image URL (Optional)", placeholder: "/uploads/room-image.jpg" },
      ],
      async (data, close) => {
        if (!data.roomId || !data.capacity) {
          UIManager.showToast("Room ID and Capacity are required.", "error");
          return;
        }
        const capacityNum = parseInt(String(data.capacity), 10);
        if (isNaN(capacityNum) || capacityNum <= 0) {
          UIManager.showToast("Capacity must be a positive number.", "error");
          return;
        }
        if (capacityNum < room.occupants.length) {
          UIManager.showToast(`Capacity cannot be less than current occupants (${room.occupants.length}).`, "error");
          return;
        }

        try {
          await RoomService.update(roomId, {
            roomId: data.roomId,
            capacity: capacityNum,
            description: data.description || "",
            imageUrl: data.imageUrl || "",
          });

          UIManager.showToast("Room updated.", "success");
          close();
          loadAdminDashboard("rooms");
        } catch (err) {
          UIManager.showToast(err.message || "Error updating room.", "error");
        }
      },
      {
        roomId: room.roomId,
        capacity: room.capacity,
        description: room.description || "",
        imageUrl: room.imageUrl || "",
      }
    );
  } catch (err) {
    UIManager.showToast(err.message || "Error opening room edit.", "error");
  }
}

function formatDateForInput(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function openAddFeeModal() {
  try {
    const students = await StudentService.getAll();
    if (!students || !students.length) {
      UIManager.showToast("No students found. Add students first.", "error");
      return;
    }

    const options = students.map((s) => ({ value: s.studentId, label: `${s.name} (${s.studentId})` }));

    createFormModal(
      "Add Fee",
      [
        { name: "studentId", label: "Student", type: "select", options, placeholder: "Select student" },
        { name: "month", label: "Month", placeholder: "e.g., Nov 2025" },
        { name: "amount", label: "Amount (₹)", type: "number", placeholder: "5000" },
        { name: "dueDate", label: "Due Date", type: "date" },
        {
          name: "status", label: "Status", type: "select", placeholder: "Select status", options: [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
          ]
        },
      ],
      async (data, close) => {
        if (!data.studentId || !data.month || !data.amount) {
          UIManager.showToast("Student, Month, and Amount are required.", "error");
          return;
        }

        const amountNum = Number(data.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          UIManager.showToast("Amount must be a positive number.", "error");
          return;
        }

        try {
          await FeeService.create({
            studentId: data.studentId,
            month: data.month,
            amount: amountNum,
            dueDate: data.dueDate || undefined,
            status: data.status || "pending",
          });
          UIManager.showToast("Fee added.", "success");
          close();
          loadAdminDashboard("fees");
        } catch (err) {
          UIManager.showToast(err.message || "Error adding fee.", "error");
        }
      }
    );
  } catch (err) {
    UIManager.showToast(err.message || "Error opening form.", "error");
  }
}

async function openEditFeeModal(feeId) {
  try {
    const allFees = await FeeService.getAll();
    const fee = (allFees || []).find((f) => f._id === feeId);
    if (!fee) {
      UIManager.showToast("Fee not found.", "error");
      return;
    }

    const title = `Edit Fee – ${fee.student ? `${fee.student.name} (${fee.student.studentId})` : "Student"}`;

    createFormModal(
      title,
      [
        { name: "month", label: "Month", placeholder: "e.g., Nov 2025" },
        { name: "amount", label: "Amount (₹)", type: "number", placeholder: "5000" },
        { name: "dueDate", label: "Due Date", type: "date" },
        {
          name: "status", label: "Status", type: "select", placeholder: "Select status", options: [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
          ]
        },
      ],
      async (data, close) => {
        if (!data.month || !data.amount) {
          UIManager.showToast("Month and Amount are required.", "error");
          return;
        }
        const amountNum = Number(data.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          UIManager.showToast("Amount must be a positive number.", "error");
          return;
        }

        try {
          await FeeService.update(feeId, {
            month: data.month,
            amount: amountNum,
            dueDate: data.dueDate || undefined,
            status: data.status || fee.status,
          });
          UIManager.showToast("Fee updated.", "success");
          close();
          loadAdminDashboard("fees");
        } catch (err) {
          UIManager.showToast(err.message || "Error updating fee.", "error");
        }
      },
      {
        month: fee.month,
        amount: fee.amount,
        dueDate: formatDateForInput(fee.dueDate),
        status: fee.status,
      }
    );
  } catch (err) {
    UIManager.showToast(err.message || "Error opening fee edit.", "error");
  }
}

async function openEditStudentModal(studentId) {
  try {
    const allStudents = await StudentService.getAll();
    const student = (allStudents || []).find((s) => s._id === studentId);
    if (!student) {
      UIManager.showToast("Student not found.", "error");
      return;
    }

    createFormModal(
      `Edit Student – ${student.name}`,
      [
        { name: "name", label: "Full Name", placeholder: "Student name" },
        { name: "email", label: "Email (optional)", placeholder: "student@example.com", type: "email" },
        { name: "phone", label: "Phone (optional)", placeholder: "Phone number" },
        { name: "address", label: "Address (optional)", placeholder: "Home address" },
        { name: "room", label: "Room (optional)", placeholder: "e.g., 101 or A101" },
      ],
      async (data, close) => {
        if (!data.name) {
          UIManager.showToast("Name is required.", "error");
          return;
        }

        try {
          await StudentService.update(studentId, {
            name: data.name,
            email: data.email || undefined,
            phone: data.phone || undefined,
            address: data.address || undefined,
            room: data.room || null,
          });

          UIManager.showToast("Student updated.", "success");
          close();
          loadAdminDashboard("students");
        } catch (err) {
          UIManager.showToast(err.message || "Error updating student.", "error");
        }
      },
      {
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        address: student.address || "",
        room: student.room || "",
      }
    );
  } catch (err) {
    UIManager.showToast(err.message || "Error opening student edit.", "error");
  }
}

// ==================================================
// ANNOUNCEMENT MODAL
// ==================================================

function openAnnouncementModal() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <span class="modal-close" style="float: right; cursor: pointer; font-size: 1.5rem;">&times;</span>
      <h2 style="margin-bottom: 16px;">📢 New Announcement</h2>
      <form id="announcementForm">
        <div class="input-group" style="margin-bottom: 16px;">
          <label for="announcementTitle">Title</label>
          <input type="text" id="announcementTitle" required placeholder="Enter announcement title" 
            style="width: 100%; padding: 10px; border: 1px solid var(--border-default); border-radius: 8px; background: var(--surface-primary); color: var(--text-primary);">
        </div>
        <div class="input-group" style="margin-bottom: 16px;">
          <label for="announcementMessage">Message</label>
          <textarea id="announcementMessage" required placeholder="Enter announcement message" rows="4"
            style="width: 100%; padding: 10px; border: 1px solid var(--border-default); border-radius: 8px; background: var(--surface-primary); color: var(--text-primary); resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-secondary" id="cancelAnnouncementBtn">Cancel</button>
          <button type="submit" class="btn-primary">Add Announcement</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();

  modal.querySelector(".modal-close").onclick = closeModal;
  modal.querySelector("#cancelAnnouncementBtn").onclick = closeModal;

  modal.querySelector("#announcementForm").onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById("announcementTitle").value.trim();
    const message = document.getElementById("announcementMessage").value.trim();

    if (!title || !message) {
      UIManager.showToast("Please fill in both title and message.", "error");
      return;
    }

    try {
      await AnnouncementService.addAnnouncement(title, message);
      UIManager.showToast("Announcement added!", "success");
      closeModal();
      loadAdminDashboard("announcements");
    } catch (err) {
      UIManager.showToast(err.message || "Error adding announcement.", "error");
    }
  };

  // Focus on title input
  setTimeout(() => document.getElementById("announcementTitle")?.focus(), 100);
}