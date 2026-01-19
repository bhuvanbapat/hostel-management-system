// public/js/student.js
// ==================================================
// student.js — Student dashboard logic (Enterprise UI)
// ==================================================

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggle = document.getElementById("themeToggle");

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      AuthService.logout();
      window.location.href = "index.html";
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      AuthService.logout();
      window.location.href = "index.html";
    };
  }

  // Theme toggle is now handled globally in ui.js
  // Removed duplicate event listener to prevent double-firing


  // Token check
  try {
    if (!AuthService.isLoggedIn()) {
      UIManager.showToast("Session expired", "error");
      return (window.location.href = "index.html");
    }
  } catch (e) {
    AuthService.logout();
    return (window.location.href = "index.html");
  }

  const decoded = AuthService.decodeToken() || {};
  const role = (decoded.user && decoded.user.role) || decoded.role || null;
  if (!role || role !== "student") {
    AuthService.logout();
    return (window.location.href = "index.html");
  }

  setupSidebar();
  loadSection("profile");
});

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function setupSidebar() {
  const items = document.querySelectorAll(".sidebar-section ul li");
  items.forEach((li) => {
    li.onclick = () => {
      items.forEach((x) => x.classList.remove("active"));
      li.classList.add("active");
      loadSection(li.dataset.section);
    };
  });
}

// ============================================================
// SECTION LOADER
// ============================================================
async function loadSection(section = "profile") {
  const root = document.getElementById("student-root");
  if (!root) return;

  root.innerHTML = "";
  UIManager.showLoading("Loading...");

  try {
    switch (section) {
      case "profile": {
        const profile = await ProfileService.get();
        root.innerHTML = Components.studentProfileEditCard(profile || {});
        break;
      }

      case "fees": {
        const fees = await FeeService.getMy();
        root.innerHTML = Components.studentFeesCard(fees || []);
        break;
      }

      case "room-request": {
        const requests = await RoomRequestService.getMy();
        const rooms = await RoomService.getAll();
        root.innerHTML = buildRoomRequestSection(requests || [], rooms || []);
        break;
      }

      case "complaints": {
        const complaints = await ComplaintService.getMy();
        root.innerHTML = Components.studentComplaintsCard(complaints || []);
        appendComplaintForm(root);
        break;
      }

      case "leaves": {
        const leaves = await LeaveService.getMy();
        root.innerHTML = buildLeaveSection(leaves || []);
        break;
      }

      case "mess": {
        let menu = await MessMenuService.getMenu().catch(() => null);
        if (!menu || typeof menu !== "object" || !menu.week) {
          menu = { week: {} };
        }
        root.innerHTML = Components.messMenuCard(menu.week || menu, false);
        break;
      }

      // ============================================================
      // ATTENDANCE - Uses getTodayStatus() for state-aware UI
      // ============================================================
      case "attendance": {
        const [logs, todayStatus] = await Promise.all([
          AttendanceService.getMyLogs().catch(() => []),
          AttendanceService.getTodayStatus().catch(() => null)
        ]);
        root.innerHTML = Components.studentAttendanceCard(logs || [], todayStatus);
        break;
      }

      case "announcements": {
        const list = await AnnouncementService.getAnnouncements();
        root.innerHTML = Components.announcementsCard(list || [], false);
        break;
      }

      case "notifications": {
        const list = await NotificationService.getMy();
        root.innerHTML = Components.studentNotificationsCard(list || []);
        break;
      }

      default:
        root.innerHTML = `<div class="card"><p>Section not found.</p></div>`;
    }
  } catch (err) {
    console.error("loadSection error:", err);
    UIManager.showToast(err.message || "Server error", "error");
  } finally {
    UIManager.hideLoading();
  }
}

// ============================================================
// COMPLAINT FORM
// ============================================================
function appendComplaintForm(root) {
  const form = document.createElement("div");
  form.className = "card";
  form.style.marginTop = "16px";
  form.innerHTML = `
    <h3>📝 Submit New Complaint</h3>
    <div class="form-group">
      <label>Describe your issue</label>
      <textarea id="complaintText" placeholder="Explain the problem you're facing..."></textarea>
    </div>
    <button class="btn-primary" id="submitComplaintBtn">Submit Complaint</button>
  `;
  root.appendChild(form);

  const submitBtn = document.getElementById("submitComplaintBtn");
  if (!submitBtn) return;

  submitBtn.onclick = async () => {
    const textEl = document.getElementById("complaintText");
    const text = textEl ? textEl.value.trim() : "";
    if (!text) return UIManager.showToast("Please enter a complaint.", "error");

    try {
      if (ComplaintService.submit) {
        await ComplaintService.submit(text);
      } else if (ComplaintService.create) {
        await ComplaintService.create({ issue: text });
      } else {
        throw new Error("Complaint service not available.");
      }
      UIManager.showToast("Complaint submitted.", "success");
      loadSection("complaints");
    } catch (err) {
      console.error("Complaint submit error:", err);
      UIManager.showToast(err.message || "Error submitting complaint.", "error");
    }
  };
}

// ============================================================
// ROOM REQUEST SECTION
// ============================================================

function buildRoomRequestSection(requests = [], rooms = []) {
  // Current requests display
  let requestsHTML = '';
  if (requests && requests.length > 0) {
    const items = requests.map(r => {
      const statusClass = r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning';
      return `
        <div class="ticket-card">
          <div class="ticket-header">
            <span class="ticket-id">Request for Room ${r.requestedRoomId}</span>
            <span class="status-badge ${statusClass}">${r.status || 'pending'}</span>
          </div>
          <div class="ticket-body">${r.reason || 'No reason provided'}</div>
          <div class="ticket-footer">
            <span>Submitted: ${new Date(r.createdAt).toLocaleDateString()}</span>
            ${r.adminRemark ? `<span>Admin: ${r.adminRemark}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    requestsHTML = `
      <div class="card">
        <h3>📋 My Room Requests (${requests.length})</h3>
        <div class="scroll-card" style="max-height:300px;">
          ${items}
        </div>
      </div>
    `;
  } else {
    requestsHTML = `
      <div class="card">
        <h3>📋 My Room Requests</h3>
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p class="empty-state-text">No room requests submitted yet.</p>
        </div>
      </div>
    `;
  }

  // Available rooms for new request (as cards)
  const availableRooms = rooms
    .filter(r => {
      const occ = r.occupants ? r.occupants.length : 0;
      return occ < r.capacity;
    });

  const defaultRoomImg = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80';

  const roomCards = availableRooms.length > 0
    ? `<div class="room-request-grid">${availableRooms.map(r => {
      const occ = r.occupants ? r.occupants.length : 0;
      const imgUrl = r.imageUrl && r.imageUrl.length > 0 ? r.imageUrl : defaultRoomImg;
      return `
          <div class="room-card room-card-with-image room-request-select-card">
            <div class="room-image-wrapper">
              <img src="${imgUrl}" alt="Room ${r.roomId}" class="room-image" loading="lazy" />
              <span class="room-id-overlay">${r.roomId}</span>
            </div>
            <div class="room-card-header">
              <span class="room-status-pill">${occ}/${r.capacity} Occupied</span>
            </div>
            <div class="room-card-body">
              ${r.description ? `<div class="room-desc">${r.description}</div>` : ''}
            </div>
            <button class="btn-primary btn-sm submit-room-request-btn" data-roomid="${r.roomId}">Request This Room</button>
          </div>
        `;
    }).join('')}</div>`
    : `<div class="empty-state"><div class="empty-state-icon">🏠</div><p class="empty-state-text">No rooms available for request.</p></div>`;

  return `
    ${requestsHTML}
    <div class="card" style="margin-top:16px;">
      <h3>🏠 Request New Room</h3>
      <div class="form-group">
        <label>Why do you want this room? (Optional)</label>
        <textarea id="requestReason" placeholder="Your reason..."></textarea>
      </div>
      <div style="margin-bottom:1rem;">
        <strong>Select a room to request:</strong>
      </div>
      ${roomCards}
    </div>
  `;
}

// ============================================================
// LEAVE SECTION
// ============================================================
function buildLeaveSection(leaves = []) {
  // Leave cards
  let leavesHTML = '';
  if (leaves && leaves.length > 0) {
    leavesHTML = Components.studentLeavesCard(leaves);
  } else {
    leavesHTML = `
      <div class="card">
        <h3>📅 My Leave Requests</h3>
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p class="empty-state-text">No leave requests submitted yet.</p>
        </div>
      </div>
    `;
  }

  return `
    ${leavesHTML}
    
    <div class="card" style="margin-top:16px;">
      <h3>📝 Apply for Leave</h3>
      <div class="form-group">
        <label>Category</label>
        <select id="leaveCategory">
          <option value="Casual Leave">Casual Leave</option>
          <option value="Medical Leave">Medical Leave</option>
          <option value="Emergency Leave">Emergency Leave</option>
          <option value="Vacation">Vacation</option>
          <option value="Home Visit">Home Visit</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="form-group">
          <label>From Date</label>
          <input type="date" id="leaveFrom">
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" id="leaveTo">
        </div>
      </div>
      <div class="form-group">
        <label>Reason</label>
        <textarea id="leaveReason" placeholder="Explain the reason for your leave..."></textarea>
      </div>
      <button class="btn-primary" id="applyLeaveBtn">Apply for Leave</button>
    </div>
  `;
}

// ============================================================
// GLOBAL EVENT HANDLERS
// ============================================================
document.addEventListener("click", async (e) => {
  const target = e.target;

  // ---- SUBMIT ROOM REQUEST (new card button logic) ----
  if (target.classList.contains("submit-room-request-btn")) {
    const roomId = target.getAttribute("data-roomid");
    const reason = document.getElementById("requestReason")?.value.trim() || "";

    if (!roomId) {
      return UIManager.showToast("Please select a room.", "error");
    }

    target.disabled = true;
    target.textContent = "Requesting...";
    try {
      await RoomRequestService.create({ requestedRoomId: roomId, reason });
      UIManager.showToast("Room request submitted.", "success");
      loadSection("room-request");
    } catch (err) {
      console.error("Submit room request error:", err);
      UIManager.showToast(err.message || "Error submitting request.", "error");
    } finally {
      target.disabled = false;
      target.textContent = "Request This Room";
    }
  }

  // ---- APPLY LEAVE ----
  if (target.id === "applyLeaveBtn") {
    const category = document.getElementById("leaveCategory").value;
    const from = document.getElementById("leaveFrom").value;
    const to = document.getElementById("leaveTo").value;
    const reason = document.getElementById("leaveReason").value.trim();

    if (!category || !from || !to || !reason) {
      return UIManager.showToast("All fields are required.", "error");
    }

    try {
      await LeaveService.create({
        category,
        fromDate: from,
        toDate: to,
        reason,
      });
      UIManager.showToast("Leave request submitted.", "success");
      loadSection("leaves");
    } catch (err) {
      console.error("Apply leave error:", err);
      UIManager.showToast(err.message || "Error creating leave request.", "error");
    }
  }

  // ---- CHECK-IN ----
  if (target.dataset.action === "checkin") {
    try {
      await AttendanceService.checkin();
      UIManager.showToast("Checked in successfully!", "success");
      loadSection("attendance");
    } catch (err) {
      UIManager.showToast(err.message || "Error checking in.", "error");
    }
  }

  // ---- CHECK-OUT ----
  if (target.dataset.action === "checkout") {
    try {
      await AttendanceService.checkout();
      UIManager.showToast("Checked out successfully!", "success");
      loadSection("attendance");
    } catch (err) {
      UIManager.showToast(err.message || "Error checking out.", "error");
    }
  }

  // ---- SAVE PROFILE ----
  if (target.dataset.action === "save-profile") {
    const nameEl = document.getElementById("editName");
    const phoneEl = document.getElementById("editPhone");
    const addrEl = document.getElementById("editAddress");

    const name = nameEl ? nameEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const address = addrEl ? addrEl.value.trim() : "";

    if (!name) {
      return UIManager.showToast("Name is required.", "error");
    }

    try {
      await ProfileService.update({ name, phone, address });
      UIManager.showToast("Profile updated.", "success");
      loadSection("profile");
    } catch (err) {
      console.error("Save profile error:", err);
      UIManager.showToast(err.message || "Error updating profile.", "error");
    }
  }

  // ---- CHANGE PASSWORD ----
  if (target.dataset.action === "change-pass") {
    const oldEl = document.getElementById("oldPass");
    const newEl = document.getElementById("newPass");

    const oldPass = oldEl ? oldEl.value : "";
    const newPass = newEl ? newEl.value : "";

    if (!oldPass || !newPass) {
      return UIManager.showToast("Both passwords are required.", "error");
    }

    try {
      await ProfileService.changePassword(oldPass, newPass);
      UIManager.showToast("Password updated successfully.", "success");
      if (oldEl) oldEl.value = "";
      if (newEl) newEl.value = "";
    } catch (err) {
      console.error("Change password error:", err);
      UIManager.showToast(err.message || "Error updating password.", "error");
    }
  }

  // ---- REFRESH FEES ----
  if (target.dataset.action === "refresh-fees") {
    loadSection("fees");
    return;
  }

  // ---- MARK ALL NOTIFICATIONS READ ----
  if (target.dataset.action === "mark-all-read") {
    try {
      await NotificationService.markAllRead();
      UIManager.showToast("All notifications marked as read.", "success");
      loadSection("notifications");
    } catch (err) {
      UIManager.showToast(err.message || "Error marking notifications.", "error");
    }
  }
});