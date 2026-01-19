// ==================================================
// adminAnalytics.js — Read-only Analytics Dashboard
// Uses existing services, NO backend changes
// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggle = document.getElementById("themeToggle");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AuthService.logout();
      window.location.href = "index.html";
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      Theme.toggle();
    });
  }

  // Auth check (admin only)
  if (!AuthService.isLoggedIn()) {
    UIManager.showToast("Session expired. Login again.", "error");
    return (window.location.href = "admin-login.html");
  }

  const decoded = AuthService.decodeToken();
  const user = decoded && decoded.user;
  if (!user || user.role !== "admin") {
    AuthService.logout();
    return (window.location.href = "index.html");
  }

  loadAnalytics();
});

async function loadAnalytics() {
  const root = document.getElementById("analytics-root");
  if (!root) return;

  UIManager.showLoading("Building analytics...");

  try {
    const [
      stats,
      students,
      rooms,
      fees,
      complaints,
      leaves,
      messMenu
    ] = await Promise.all([
      DashboardService.getStats().catch(() => ({})),
      StudentService.getAll().catch(() => []),
      RoomService.getAll().catch(() => []),
      FeeService.getAll().catch(() => []),
      ComplaintService.getAll().catch(() => []),
      LeaveService.getAll().catch(() => []),
      (MessMenuService.getMenu
        ? MessMenuService.getMenu()
        : MessMenuService.getWeeklyMenu
        ? MessMenuService.getWeeklyMenu()
        : Promise.resolve(null)
      ).catch(() => null),
    ]);

    const quick = computeQuickStats(stats, rooms, fees, complaints, leaves);

    root.innerHTML = buildAnalyticsLayout(quick);

    // after layout is inserted, draw charts
    buildRoomOccupancyChart(rooms);
    buildFeesStatusChart(fees);
    buildComplaintsTrendChart(complaints);
    buildLeaveStatusChart(leaves);
  } catch (err) {
    console.error(err);
    UIManager.showToast(err.message || "Error loading analytics.", "error");
  }

  UIManager.hideLoading();
}

// --------------------------------------------------
// Quick aggregate stats
// --------------------------------------------------
function computeQuickStats(stats, rooms, fees, complaints, leaves) {
  const totalRooms = stats.totalRooms || (rooms ? rooms.length : 0);
  const totalStudents = stats.totalStudents || 0;

  let totalCapacity = 0;
  let totalOccupants = 0;
  (rooms || []).forEach((r) => {
    const cap = r.capacity || 0;
    const occ = (r.occupants && r.occupants.length) || 0;
    totalCapacity += cap;
    totalOccupants += occ;
  });
  const occupancyPercent =
    totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0;

  const pendingFees = (fees || []).filter((f) => f.status === "pending").length;
  const paidFees = (fees || []).filter((f) => f.status === "paid").length;

  const pendingComplaints = (complaints || []).filter(
    (c) => c.status === "pending"
  ).length;
  const resolvedComplaints = (complaints || []).filter(
    (c) => c.status === "resolved"
  ).length;

  const pendingLeaves = (leaves || []).filter(
    (l) => l.status === "pending"
  ).length;
  const approvedLeaves = (leaves || []).filter(
    (l) => l.status === "approved"
  ).length;
  const rejectedLeaves = (leaves || []).filter(
    (l) => l.status === "rejected"
  ).length;

  return {
    totalStudents,
    totalRooms,
    totalCapacity,
    totalOccupants,
    occupancyPercent,
    pendingFees,
    paidFees,
    pendingComplaints,
    resolvedComplaints,
    pendingLeaves,
    approvedLeaves,
    rejectedLeaves,
  };
}

// --------------------------------------------------
// Layout builder (cards + canvases)
// --------------------------------------------------
function buildAnalyticsLayout(q) {
  return `
    <div class="card">
      <h2>Analytics Overview</h2>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">
        Read-only insights generated from live hostel data.
      </p>
      <div class="stats-grid" style="margin-top:8px;">
        <div class="stat-card">
          <h4>Total Students</h4>
          <div class="stat-value">${q.totalStudents}</div>
        </div>
        <div class="stat-card">
          <h4>Total Rooms</h4>
          <div class="stat-value">${q.totalRooms}</div>
        </div>
        <div class="stat-card">
          <h4>Beds Occupied</h4>
          <div class="stat-value">${q.totalOccupants}/${q.totalCapacity}</div>
        </div>
        <div class="stat-card">
          <h4>Occupancy</h4>
          <div class="stat-value">${q.occupancyPercent}%</div>
        </div>
        <div class="stat-card">
          <h4>Pending Complaints</h4>
          <div class="stat-value">${q.pendingComplaints}</div>
        </div>
        <div class="stat-card">
          <h4>Pending Fee Records</h4>
          <div class="stat-value">${q.pendingFees}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Room Occupancy by Room</h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
        Each bar shows how full a room is (occupied beds vs capacity).
      </p>
      <div style="max-height:320px;">
        <canvas id="roomOccChart"></canvas>
      </div>
    </div>

    <div class="card">
      <h3>Fee Status Distribution</h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
        Comparison of paid vs pending fee entries.
      </p>
      <div style="max-height:320px;">
        <canvas id="feeStatusChart"></canvas>
      </div>
    </div>

    <div class="card">
      <h3>Complaints Over Time</h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
        New complaints opened per day.
      </p>
      <div style="max-height:320px;">
        <canvas id="complaintsTrendChart"></canvas>
      </div>
    </div>

    <div class="card">
      <h3>Leave Requests by Status</h3>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
        Breakdown of pending, approved and rejected leave applications.
      </p>
      <div style="max-height:320px;">
        <canvas id="leaveStatusChart"></canvas>
      </div>
    </div>
  `;
}

// --------------------------------------------------
// Charts
// --------------------------------------------------

function buildRoomOccupancyChart(rooms) {
  const ctx = document.getElementById("roomOccChart");
  if (!ctx || !rooms) return;

  const labels = rooms.map((r) => r.roomId || "Room");
  const occupancies = rooms.map((r) => (r.occupants ? r.occupants.length : 0));
  const capacities = rooms.map((r) => r.capacity || 0);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Occupants",
          data: occupancies,
        },
        {
          label: "Capacity",
          data: capacities,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  });
}

function buildFeesStatusChart(fees) {
  const ctx = document.getElementById("feeStatusChart");
  if (!ctx || !fees) return;

  const paid = fees.filter((f) => f.status === "paid").length;
  const pending = fees.filter((f) => f.status === "pending").length;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Paid", "Pending"],
      datasets: [
        {
          data: [paid, pending],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function buildComplaintsTrendChart(complaints) {
  const ctx = document.getElementById("complaintsTrendChart");
  if (!ctx || !complaints) return;

  // group by date (yyyy-mm-dd)
  const countsByDay = {};
  (complaints || []).forEach((c) => {
    const d = new Date(c.createdAt || c.updatedAt || Date.now());
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  });

  const labels = Object.keys(countsByDay).sort();
  const values = labels.map((k) => countsByDay[k]);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "New complaints",
          data: values,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  });
}

function buildLeaveStatusChart(leaves) {
  const ctx = document.getElementById("leaveStatusChart");
  if (!ctx || !leaves) return;

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;
  const rejected = leaves.filter((l) => l.status === "rejected").length;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Pending", "Approved", "Rejected"],
      datasets: [
        {
          label: "Leave Requests",
          data: [pending, approved, rejected],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  });
}
