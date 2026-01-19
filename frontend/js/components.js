// =====================================================================
// components.js — Enterprise-Grade HMS Component Library
// Professional institutional UI with meaningful interactions
// =====================================================================

window.Components = {

  // ============================================================
  // ADMIN DASHBOARD — OVERVIEW (Enterprise Command Center)
  // ============================================================
  adminStats(stats) {
    const statItems = [
      {
        icon: '👥',
        label: 'Total Students',
        value: stats.totalStudents || 0,
        color: 'var(--status-info)'
      },
      {
        icon: '🏠',
        label: 'Total Rooms',
        value: stats.totalRooms || 0,
        color: 'var(--accent-primary)'
      },
      {
        icon: '✅',
        label: 'Available Rooms',
        value: stats.availableRooms || 0,
        color: 'var(--status-success)'
      },
      {
        icon: '📋',
        label: 'Pending Complaints',
        value: stats.pendingComplaints || 0,
        color: 'var(--status-warning)'
      },
      {
        icon: '💰',
        label: 'Pending Fees',
        value: stats.pendingFees || 0,
        color: 'var(--status-error)'
      },
    ];

    const cards = statItems.map(item => `
      <div class="stat-card-enterprise">
        <div class="stat-card-icon-enterprise" style="background: ${item.color}20; color: ${item.color};">
          ${item.icon}
        </div>
        <div class="stat-card-label">${item.label}</div>
        <div class="stat-card-value">${item.value}</div>
      </div>
    `).join('');

    return `
      <div class="card card-admin-stats-enterprise">
        <div class="card-header">
          <h2>📊 Dashboard Overview</h2>
        </div>
        <div class="stats-grid-enterprise">
          ${cards}
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — STUDENTS TABLE
  // ============================================================
  adminStudentsTable(students) {
    if (!students || students.length === 0) {
      return `
        <div class="card card-admin-students-enterprise">
          <div class="card-header">
            <h3>👥 Students</h3>
            <button class="btn-primary" data-action="open-add-student-modal">+ Add Student</button>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p class="empty-state-text">No students registered yet.</p>
          </div>
        </div>
      `;
    }

    const rows = students.map(s => {
      // Build full URL for profile photos (stored as /uploads/...)
      let avatarUrl = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(s.name || 'Student');
      if (s.profilePhotoUrl && s.profilePhotoUrl.length > 0) {
        // If it's a relative path, prefix with backend URL
        avatarUrl = s.profilePhotoUrl.startsWith('http')
          ? s.profilePhotoUrl
          : 'http://localhost:3000' + s.profilePhotoUrl;
      }
      return `
        <tr>
          <td>
            <div class="admin-student-avatar-row">
              <img src="${avatarUrl}" alt="Avatar" class="profile-avatar admin-student-avatar" loading="lazy" />
              <div>
                <div style="font-weight:500;">${s.name || '-'}</div>
                <div class="cell-id">${s.studentId || '-'}</div>
              </div>
            </div>
          </td>
          <td>${s.email || '-'}</td>
          <td>${s.phone || '-'}</td>
          <td><span class="status-badge info">${s.room || 'Unassigned'}</span></td>
          <td class="cell-actions">
            <button class="btn-info btn-sm" data-action="upload-photo" data-id="${s._id}">📷 Photo</button>
            <button class="btn-secondary btn-sm" data-action="edit-student" data-id="${s._id}">Edit</button>
            <button class="btn-danger btn-sm" data-action="delete-student" data-id="${s._id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');


    return `
      <div class="card card-admin-students-enterprise">
        <div class="card-header">
          <h3>👥 Students (${students.length})</h3>
          <button class="btn-primary" data-action="open-add-student-modal">+ Add Student</button>
        </div>
        <div class="table-wrapper scroll-card table-admin-students-enterprise">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Room</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — ROOMS (Card Grid View)
  // ============================================================
  adminRoomsTable(rooms) {
    if (!rooms || rooms.length === 0) {
      return `
        <div class="card card-admin-rooms-enterprise">
          <div class="card-header">
            <h3>🏠 Rooms</h3>
            <button class="btn-primary" data-action="open-add-room-modal">+ Add Room</button>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">🏠</div>
            <p class="empty-state-text">No rooms configured.</p>
          </div>
        </div>
      `;
    }

    const defaultRoomImg = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80';
    const roomCards = rooms.map(r => {
      const occ = r.occupants ? r.occupants.length : 0;
      const cap = r.capacity || 4;
      const percentage = Math.round((occ / cap) * 100);

      let status, statusClass;
      if (occ === 0) {
        status = 'Empty';
        statusClass = 'room-status-available';
      } else if (occ < cap) {
        status = 'Partial';
        statusClass = 'room-status-maintenance';
      } else {
        status = 'Full';
        statusClass = 'room-status-full';
      }

      // Bed slots visualization
      let beds = '';
      for (let i = 0; i < cap; i++) {
        beds += `<span class="bed-slot ${i < occ ? 'occupied' : ''}">🛏</span>`;
      }

      // Room image (use r.imageUrl if present, else fallback)
      const imgUrl = r.imageUrl && r.imageUrl.length > 0 ? r.imageUrl : defaultRoomImg;

      return `
        <div class="room-card room-card-with-image room-card-admin-enterprise">
          <div class="room-image-wrapper">
            <img src="${imgUrl}" alt="Room ${r.roomId}" class="room-image" loading="lazy" />
            <span class="room-id-overlay">${r.roomId}</span>
          </div>
          <div class="room-card-header">
            <span class="room-status-pill ${statusClass}">${status}</span>
          </div>
          <div class="bed-row">${beds}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:0.8rem;color:var(--text-muted);">Occupancy</span>
            <span style="font-size:0.875rem;font-weight:600;">${occ}/${cap}</span>
          </div>
          <div style="background:var(--border-subtle);border-radius:4px;height:6px;margin-bottom:12px;">
            <div style="background:var(--accent-primary);height:100%;border-radius:4px;width:${percentage}%;transition:width 0.3s;"></div>
          </div>
          ${r.description ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">${r.description}</p>` : ''}
          <div class="room-card-footer">
            <button class="btn-secondary btn-sm" data-action="edit-room" data-id="${r._id}">Edit</button>
            <button class="btn-danger btn-sm" data-action="delete-room" data-id="${r._id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card card-admin-rooms-enterprise">
        <div class="card-header">
          <h3>🏠 Rooms (${rooms.length})</h3>
          <button class="btn-primary" data-action="open-add-room-modal">+ Add Room</button>
        </div>
        <div class="room-grid room-grid-admin-enterprise">${roomCards}</div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — ROOM REQUESTS TABLE
  // ============================================================
  adminRoomRequestsTable(requests) {
    if (!requests || requests.length === 0) {
      return `
        <div class="card card-admin-roomrequests-enterprise">
          <h3>📝 Room Requests</h3>
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <p class="empty-state-text">No pending room requests.</p>
          </div>
        </div>
      `;
    }

    const rows = requests.map(r => {
      const studentName = r.student ? r.student.name : r.studentId || '-';
      const studentId = r.student ? r.student.studentId : r.studentId || '-';
      const statusClass = r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning';
      return `
        <tr>
          <td>
            <div class="admin-roomreq-student-row">
              <span class="admin-roomreq-student-name">${studentName}</span>
              <span class="cell-id">${studentId}</span>
            </div>
          </td>
          <td>${r.requestedRoomId || '-'}</td>
          <td><span class="status-badge ${statusClass}">${r.status || 'pending'}</span></td>
          <td class="cell-date">${new Date(r.createdAt).toLocaleDateString()}</td>
          <td class="cell-actions">
            ${r.status === 'pending' ? `
              <button class="btn-success btn-sm" data-action="approve-request" data-id="${r._id}">Approve</button>
              <button class="btn-danger btn-sm" data-action="reject-request" data-id="${r._id}">Reject</button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card card-admin-roomrequests-enterprise">
        <h3>📝 Room Requests (${requests.length})</h3>
        <div class="table-wrapper scroll-card table-admin-roomrequests-enterprise">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Requested Room</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — FEES TABLE
  // ============================================================
  adminFeesTable(fees) {
    if (!fees || fees.length === 0) {
      return `
        <div class="card card-admin-fees-enterprise">
          <div class="card-header">
            <h3>💰 Fee Records</h3>
            <button class="btn-primary" data-action="open-add-fee-modal">+ Add Fee</button>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">💰</div>
            <p class="empty-state-text">No fee records found.</p>
          </div>
        </div>
      `;
    }

    const rows = fees.map(f => {
      const statusClass = f.status === 'paid' ? 'success' : f.status === 'overdue' ? 'error' : 'warning';
      const studentName = f.student ? f.student.name : f.studentId || '-';
      return `
        <tr>
          <td>${studentName}</td>
          <td>${f.month || '-'}</td>
          <td>₹${(f.amount || 0).toLocaleString()}</td>
          <td class="cell-date">${f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</td>
          <td><span class="status-badge ${statusClass}">${(f.status || 'pending').toUpperCase()}</span></td>
          <td class="cell-actions">
            <button class="btn-info btn-sm" data-action="toggle-fee-status" data-id="${f._id}">Toggle</button>
            <button class="btn-secondary btn-sm" data-action="edit-fee" data-id="${f._id}">Edit</button>
            <button class="btn-danger btn-sm" data-action="delete-fee" data-id="${f._id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card card-admin-fees-enterprise">
        <div class="card-header">
          <h3>💰 Fee Records (${fees.length})</h3>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn-secondary" data-action="generate-monthly-fees">Generate Monthly</button>
            <button class="btn-primary" data-action="open-add-fee-modal">+ Add Fee</button>
          </div>
        </div>
        <div class="table-wrapper scroll-card table-admin-fees-enterprise">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — COMPLAINTS (Ticket System)
  // ============================================================
  adminComplaintsTable(complaints) {
    if (!complaints || complaints.length === 0) {
      return `
        <div class="card">
          <h3>🎫 Complaints</h3>
          <div class="empty-state">
            <div class="empty-state-icon">🎫</div>
            <p class="empty-state-text">No complaints received.</p>
          </div>
        </div>
      `;
    }

    const rows = complaints.map(c => {
      const statusClass = c.status === 'resolved' ? 'success' : c.status === 'in-progress' ? 'info' : 'warning';

      return `
        <tr>
          <td class="cell-id">#${(c._id || '').slice(-6).toUpperCase()}</td>
          <td>${c.studentId || '-'}</td>
          <td style="max-width:300px;">${c.issue || '-'}</td>
          <td><span class="status-badge ${statusClass}">${c.status || 'pending'}</span></td>
          <td class="cell-actions">
            ${c.status !== 'resolved' ? `
              <button class="btn-success btn-sm" data-action="resolve-complaint" data-id="${c._id}">Resolve</button>
            ` : ''}
            <button class="btn-danger btn-sm" data-action="delete-complaint" data-id="${c._id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card">
        <h3>🎫 Complaints (${complaints.length})</h3>
        <div class="table-wrapper scroll-card">
          <table class="table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Student</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — LEAVE REQUESTS
  // ============================================================
  adminLeavesTable(leaves) {
    if (!leaves || leaves.length === 0) {
      return `
        <div class="card">
          <h3>📅 Leave Requests</h3>
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p class="empty-state-text">No leave requests.</p>
          </div>
        </div>
      `;
    }

    const rows = leaves.map(l => {
      const statusClass = l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning';
      const studentName = l.student ? `${l.student.name} (${l.student.studentId})` : l.studentId || '-';
      const fromDate = new Date(l.fromDate).toLocaleDateString();
      const toDate = new Date(l.toDate).toLocaleDateString();

      // Calculate duration
      const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;

      return `
        <tr>
          <td>${studentName}</td>
          <td><span class="status-badge info">${l.category || '-'}</span></td>
          <td>${fromDate} → ${toDate}</td>
          <td style="font-weight:500;">${days} day${days > 1 ? 's' : ''}</td>
          <td style="max-width:200px;font-size:0.8rem;">${l.reason || '-'}</td>
          <td><span class="status-badge ${statusClass}">${l.status || 'pending'}</span></td>
          <td class="cell-actions">
            ${l.status === 'pending' ? `
              <button class="btn-success btn-sm" data-action="approve-leave" data-id="${l._id}">Approve</button>
              <button class="btn-danger btn-sm" data-action="reject-leave" data-id="${l._id}">Reject</button>
            ` : ''}
            <button class="btn-secondary btn-sm" data-action="delete-leave" data-id="${l._id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card">
        <h3>📅 Leave Requests (${leaves.length})</h3>
        <div class="table-wrapper scroll-card">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Category</th>
                <th>Period</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ============================================================
  // ANNOUNCEMENTS (Bulletin Style)
  // ============================================================
  announcementsCard(list, isAdmin = false) {
    if (!list || list.length === 0) {
      return `
        <div class="card">
          <div class="card-header">
            <h3>📢 Announcements</h3>
            ${isAdmin ? '<button class="btn-primary" data-action="open-add-announcement-modal">+ New Announcement</button>' : ''}
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">📢</div>
            <p class="empty-state-text">No announcements yet.</p>
          </div>
        </div>
      `;
    }

    const items = list.map(a => `
      <div class="announcement-card">
        <div class="announcement-header">
          <span class="announcement-title">${a.title || 'Announcement'}</span>
          <span class="announcement-date">${new Date(a.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="announcement-body">${a.message || ''}</div>
        ${isAdmin ? `
          <div style="margin-top:12px;">
            <button class="btn-danger btn-sm" data-action="delete-announcement" data-id="${a._id}">Delete</button>
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="card">
        <div class="card-header">
          <h3>📢 Announcements (${list.length})</h3>
          ${isAdmin ? '<button class="btn-primary" data-action="open-add-announcement-modal">+ New Announcement</button>' : ''}
        </div>
        <div class="scroll-card" style="max-height:500px;">
          ${items}
        </div>
      </div>
    `;
  },

  // ============================================================
  // MESS MENU - VERTICAL TABLE LAYOUT (Clear, one day per row)
  // ============================================================
  messMenuCard(menu, isAdmin = false) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const formatMeal = (val) => {
      if (!val) return '<span style="color:var(--text-muted);font-style:italic;">Not served</span>';
      if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '<span style="color:var(--text-muted);font-style:italic;">Not served</span>';
      return val;
    };

    const dayCards = days.map(day => {
      const dataSrc = (menu && menu.week) ? menu.week : (menu || {});
      const key = Object.keys(dataSrc).find(k => k.toLowerCase() === day.toLowerCase());
      const dayMenu = key ? dataSrc[key] : { breakfast: [], lunch: [], dinner: [] };
      const isToday = day === today;

      // Highlight today's card style
      const activeStyle = isToday ? 'border-color:var(--brand-primary);box-shadow:var(--shadow-lg);transform:translateY(-4px);' : '';
      const badge = isToday ? '<span class="status-badge success" style="font-size:0.75rem;margin-left:auto;">TODAY</span>' : '';

      return `
        <div class="mess-day-card" style="${activeStyle}">
          <div class="mess-day-header">
            <span class="mess-day-title">${day}</span>
            ${badge}
          </div>
          <div class="mess-day-body">
            <div class="mess-meal-row">
              <div class="mess-meal-type">🍳 Breakfast</div>
              <div class="mess-meal-items">${formatMeal(dayMenu.breakfast)}</div>
            </div>
            <div class="mess-meal-row">
              <div class="mess-meal-type">🍱 Lunch</div>
              <div class="mess-meal-items">${formatMeal(dayMenu.lunch)}</div>
            </div>
            <div class="mess-meal-row">
              <div class="mess-meal-type">🍽️ Dinner</div>
              <div class="mess-meal-items">${formatMeal(dayMenu.dinner)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card">
        <div class="card-header">
          <h3>🍽️ Weekly Mess Menu</h3>
          ${isAdmin ? '<a href="admin-mess-editor.html" class="btn-primary btn-sm">✏️ Edit Menu</a>' : ''}
        </div>
        <div class="mess-menu-container">
          ${dayCards}
        </div>
      </div>
    `;
  },



  // ============================================================
  // STUDENT — PROFILE (Structured Sections)
  // ============================================================
  studentProfileCard(student) {
    const avatarInitial = student.name ? student.name.charAt(0).toUpperCase() : '?';

    return `
      <div class="card">
        <div class="profile-header">
          <div class="profile-avatar">${avatarInitial}</div>
          <div class="profile-info">
            <h3>${student.name || 'Student'}</h3>
            <p>Student ID: ${student.studentId || '-'}</p>
          </div>
        </div>
        
        <div class="section-title">Personal Information</div>
        <div class="profile-details">
          <div class="profile-field">
            <label>Full Name</label>
            <div class="value">${student.name || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Email</label>
            <div class="value">${student.email || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Phone</label>
            <div class="value">${student.phone || '-'}</div>
          </div>
          <div class="profile-field">
            <label>Address</label>
            <div class="value">${student.address || '-'}</div>
          </div>
        </div>
        
        <div class="section-title" style="margin-top:24px;">Room Information</div>
        <div class="profile-details">
          <div class="profile-field">
            <label>Assigned Room</label>
            <div class="value">
              ${student.room ? `<span class="status-badge success">${student.room}</span>` : '<span class="status-badge warning">Not Assigned</span>'}
            </div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn-secondary" data-action="edit-profile">✏️ Edit Profile</button>
          <button class="btn-secondary" data-action="change-password">🔐 Change Password</button>
        </div>
      </div>
    `;
  },

  // ============================================================
  // STUDENT — PROFILE EDIT
  // ============================================================
  studentProfileEditCard(profile) {
    // Build full URL for profile photos (stored as /uploads/...)
    let avatarUrl = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(profile.name || 'Student');
    if (profile.profilePhotoUrl && profile.profilePhotoUrl.length > 0) {
      avatarUrl = profile.profilePhotoUrl.startsWith('http')
        ? profile.profilePhotoUrl
        : 'http://localhost:3000' + profile.profilePhotoUrl;
    }
    return `
      <div class="card profile-card-enterprise">
        <div class="profile-header-grid">
          <div class="profile-avatar-wrapper">
            <img src="${avatarUrl}" alt="Profile Photo" class="profile-avatar" loading="lazy" />
          </div>
          <div class="profile-info-grid">
            <div class="profile-info-item">
              <span class="profile-label">Name</span>
              <span class="profile-value">${profile.name || '-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Student ID</span>
              <span class="profile-value">${profile.studentId || '-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Phone</span>
              <span class="profile-value">${profile.phone || '-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Address</span>
              <span class="profile-value">${profile.address || '-'}</span>
            </div>
            <div class="profile-info-item">
              <span class="profile-label">Room</span>
              <span class="profile-value">${profile.room || 'Not assigned'}</span>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <form class="profile-form-enterprise" autocomplete="off" onsubmit="return false;">
          <h3>✏️ Edit Profile</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="editName" value="${profile.name || ''}" placeholder="Enter your name">
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" id="editPhone" value="${profile.phone || ''}" placeholder="Enter phone number">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:2;">
              <label>Address</label>
              <textarea id="editAddress" placeholder="Enter your address">${profile.address || ''}</textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" data-action="save-profile">Save Changes</button>
            <button class="btn-secondary" data-action="cancel-edit">Cancel</button>
          </div>
        </form>
        <div class="divider"></div>
        <form class="profile-form-enterprise" autocomplete="off" onsubmit="return false;">
          <h3>🔐 Change Password</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" id="oldPass" placeholder="Enter current password">
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="newPass" placeholder="Enter new password">
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" data-action="change-pass">Update Password</button>
          </div>
        </form>
      </div>
    `;
  },

  // ============================================================
  // STUDENT — FEES (Financial UX) - FIXED VERSION
  // ============================================================
  studentFeesCard(fees) {
    if (!fees || fees.length === 0) {
      return `
        <div class="card card-fees-enterprise">
          <div class="card-header">
            <h3>💰 My Fees</h3>
            <button class="btn-secondary btn-sm" data-action="refresh-fees">↻ Refresh</button>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">💰</div>
            <p class="empty-state-text">No fee records found.</p>
          </div>
        </div>
      `;
    }

    // Calculate totals
    const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const paidAmount = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);
    const pendingAmount = totalAmount - paidAmount;

    const feeCards = fees.map(f => {
      const statusClass = f.status === 'paid' ? 'success' : 'warning';
      const statusIcon = f.status === 'paid' ? '✅' : '⏳';
      const dueDate = f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-';
      const isOverdue = f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date();

      return `
        <div class="fee-card fee-card-enterprise ${f.status === 'paid' ? 'paid' : 'pending'} ${isOverdue ? 'overdue' : ''}">
          <div class="fee-card-header">
            <span class="fee-month">${f.month || 'N/A'}</span>
            <span class="status-badge ${statusClass}">${statusIcon} ${(f.status || 'pending').toUpperCase()}</span>
          </div>
          <div class="fee-card-body">
            <div class="fee-amount">₹${(f.amount || 0).toLocaleString()}</div>
            <div class="fee-due-date">
              📅 Due: ${dueDate}
              ${isOverdue ? '<span class="overdue-badge">OVERDUE</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card card-fees-enterprise">
        <div class="card-header">
          <h3>💰 My Fees (${fees.length})</h3>
          <button class="btn-secondary btn-sm" data-action="refresh-fees">↻ Refresh</button>
        </div>
        
        <div class="fee-summary-enterprise">
          <div class="fee-summary-item">
            <span class="fee-summary-label">Total</span>
            <span class="fee-summary-value">₹${totalAmount.toLocaleString()}</span>
          </div>
          <div class="fee-summary-item paid">
            <span class="fee-summary-label">Paid</span>
            <span class="fee-summary-value">₹${paidAmount.toLocaleString()}</span>
          </div>
          <div class="fee-summary-item pending">
            <span class="fee-summary-label">Pending</span>
            <span class="fee-summary-value">₹${pendingAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <div class="fee-grid-enterprise scroll-card" style="max-height:400px;">
          ${feeCards}
        </div>
      </div>
    `;
  },

  // ============================================================
  // STUDENT — COMPLAINTS (Ticket Style)
  // ============================================================
  studentComplaintsCard(complaints) {
    if (!complaints || complaints.length === 0) {
      return `
        <div class="card card-complaints-enterprise">
          <h3>🎫 Your Complaints</h3>
          <div class="empty-state">
            <div class="empty-state-icon">🎫</div>
            <p class="empty-state-text">No complaints submitted.</p>
          </div>
        </div>
      `;
    }

    const statusIcons = {
      resolved: '✅',
      'in-progress': '🛠️',
      pending: '⏳',
      open: '📬',
    };

    const tickets = complaints.map(c => {
      const statusClass = c.status === 'resolved' ? 'success' : c.status === 'in-progress' ? 'info' : 'warning';
      const icon = statusIcons[c.status] || '📬';
      return `
        <div class="ticket-card ticket-card-enterprise">
          <div class="ticket-header">
            <span class="ticket-status-icon">${icon}</span>
            <span class="ticket-id">Ticket #${(c._id || '').slice(-6).toUpperCase()}</span>
            <span class="status-badge ${statusClass}">${c.status || 'pending'}</span>
          </div>
          <div class="ticket-body">${c.issue || '-'}</div>
          <div class="ticket-footer">
            <span>Submitted: ${new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card card-complaints-enterprise">
        <h3>🎫 Your Complaints (${complaints.length})</h3>
        <div class="ticket-grid-enterprise scroll-card" style="max-height:400px;">
          ${tickets}
        </div>
      </div>
    `;
  },

  // ============================================================
  // STUDENT — LEAVES (Calendar Aligned)
  // ============================================================
  studentLeavesCard(leaves) {
    if (!leaves || leaves.length === 0) {
      return `
        <div class="card card-leaves-enterprise">
          <h3>📅 Your Leave Requests</h3>
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p class="empty-state-text">No leave requests submitted.</p>
          </div>
        </div>
      `;
    }

    const categoryIcons = {
      medical: '🏥',
      personal: '👤',
      emergency: '🚨',
      vacation: '🏖️',
      'home visit': '🏠',
      general: '📋',
    };

    const leaveCards = leaves.map(l => {
      const statusClass = l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning';
      const fromDate = new Date(l.fromDate).toLocaleDateString();
      const toDate = new Date(l.toDate).toLocaleDateString();
      const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
      const icon = categoryIcons[(l.category || '').toLowerCase()] || '📋';
      return `
        <div class="leave-card leave-card-enterprise">
          <div class="leave-header">
            <span class="leave-category">${icon} ${l.category || 'General'}</span>
            <span class="status-badge ${statusClass}">${l.status || 'pending'}</span>
          </div>
          <div class="leave-dates">
            📅 ${fromDate} → ${toDate}
            <span class="leave-duration">(${days} day${days > 1 ? 's' : ''})</span>
          </div>
          <div class="leave-reason">${l.reason || '-'}</div>
          ${l.adminRemark ? `
            <div class="leave-remark">
              <strong>Admin Remark:</strong> ${l.adminRemark}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="card card-leaves-enterprise">
        <h3>📅 Your Leave Requests (${leaves.length})</h3>
        <div class="leave-grid-enterprise scroll-card" style="max-height:400px;">
          ${leaveCards}
        </div>
      </div>
    `;
  },

  // ============================================================
  // STUDENT — ATTENDANCE (State-Aware)
  // ============================================================
  studentAttendanceCard(logs, todayStatus = null) {
    // Today's status section
    let statusSection = '';

    if (todayStatus) {
      const { checkedIn, checkedOut, canCheckIn, canCheckOut } = todayStatus;

      let statusIcon, statusText, statusClass;
      if (checkedOut) {
        statusIcon = '✅';
        statusText = 'You have completed attendance for today';
        statusClass = 'checked-out';
      } else if (checkedIn) {
        statusIcon = '🟢';
        statusText = 'You are currently checked in';
        statusClass = 'checked-in';
      } else {
        statusIcon = '⚪';
        statusText = 'You have not checked in today';
        statusClass = '';
      }

      statusSection = `
        <div class="attendance-status-enterprise">
          <div class="attendance-status-icon ${statusClass}">${statusIcon}</div>
          <div class="attendance-status-info">
            <h4>Today's Status</h4>
            <p>${statusText}</p>
          </div>
        </div>
        <div class="attendance-actions-enterprise">
          <button class="btn-primary" data-action="checkin" ${!canCheckIn ? 'disabled' : ''}>
            🔓 Check In
          </button>
          <button class="btn-secondary" data-action="checkout" ${!canCheckOut ? 'disabled' : ''}>
            🔒 Check Out
          </button>
        </div>
      `;
    } else {
      // Fallback if no today status
      statusSection = `
        <div class="attendance-actions-enterprise">
          <button class="btn-primary" data-action="checkin">🔓 Check In</button>
          <button class="btn-secondary" data-action="checkout">🔒 Check Out</button>
        </div>
      `;
    }

    // Attendance log
    const rows = (logs || []).map(l => `
      <tr>
        <td>
          <span class="status-badge ${l.type === 'checkin' ? 'success' : 'info'}">
            ${l.type === 'checkin' ? '🔓 Check In' : '🔒 Check Out'}
          </span>
        </td>
        <td class="cell-date">${new Date(l.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div class="card card-attendance-enterprise">
        <h3>📋 Attendance</h3>
        
        ${statusSection}
        
        <div class="section-title">Attendance History</div>
        ${logs && logs.length > 0 ? `
          <div class="table-wrapper scroll-card table-attendance-enterprise">
            <table class="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state" style="padding:20px;">
            <p class="empty-state-text">No attendance records yet.</p>
          </div>
        `}
      </div>
    `;
  },

  // ============================================================
  // STUDENT — NOTIFICATIONS (Read/Unread)
  // ============================================================
  studentNotificationsCard(list) {
    if (!list || list.length === 0) {
      return `
        <div class="card card-notifications-enterprise">
          <h3>🔔 Notifications</h3>
          <div class="empty-state">
            <div class="empty-state-icon">🔔</div>
            <p class="empty-state-text">No notifications yet.</p>
          </div>
        </div>
      `;
    }

    const typeIcons = {
      fee: '💰',
      complaint: '🎫',
      leave: '📅',
      announcement: '📢',
      system: '⚙️'
    };

    const items = list.map(n => {
      const icon = typeIcons[n.type] || '📬';
      const isUnread = !n.read;
      return `
        <div class="notification-item notification-item-enterprise ${isUnread ? 'unread' : ''}" data-id="${n._id}">
          <div class="notification-icon notification-icon-enterprise">${icon}</div>
          <div class="notification-content notification-content-enterprise">
            <div class="notification-title">${n.title || n.type || 'Notification'}</div>
            <div class="notification-message">${n.message || ''}</div>
            <div class="notification-time">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card card-notifications-enterprise">
        <div class="card-header">
          <h3>🔔 Notifications (${list.length})</h3>
          <button class="btn-secondary btn-sm" data-action="mark-all-read">Mark All Read</button>
        </div>
        <div class="notification-list-enterprise scroll-card" style="max-height:500px;">
          ${items}
        </div>
      </div>
    `;
  },

  // ============================================================
  // ADMIN — NOTIFICATIONS
  // ============================================================
  adminNotificationsCard(list) {
    if (!list || list.length === 0) {
      return `
        <div class="card card-notifications-enterprise">
          <div class="card-header">
            <h3>🔔 Notifications</h3>
            <button class="btn-secondary btn-sm" data-action="mark-all-read">Mark All Read</button>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">🔔</div>
            <p class="empty-state-text">No notifications.</p>
          </div>
        </div>
      `;
    }

    const typeIcons = {
      fee: '💰',
      complaint: '🎫',
      leave: '📅',
      announcement: '📢',
      system: '⚙️'
    };

    const items = list.map(n => {
      const icon = typeIcons[n.type] || '📬';
      const isUnread = !n.read;
      return `
        <div class="notification-item notification-item-enterprise ${isUnread ? 'unread' : ''}" data-id="${n._id}">
          <div class="notification-icon notification-icon-enterprise">${icon}</div>
          <div class="notification-content notification-content-enterprise">
            <div class="notification-title">${n.title || n.type || 'Notification'}</div>
            <div class="notification-message">${n.message || ''}</div>
            <div class="notification-time">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
          <button class="btn-danger btn-sm" data-action="delete-notification" data-id="${n._id}" style="flex-shrink:0;">Delete</button>
        </div>
      `;
    }).join('');

    return `
      <div class="card card-notifications-enterprise">
        <div class="card-header">
          <h3>🔔 Notifications (${list.length})</h3>
          <button class="btn-secondary btn-sm" data-action="mark-all-read">Mark All Read</button>
        </div>
        <div class="notification-list-enterprise scroll-card" style="max-height:500px;">
          ${items}
        </div>
      </div>
    `;
  },
};