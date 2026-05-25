// ===== CCS SIT-IN MONITORING SYSTEM =====
// API-based data management (Node.js + MySQL backend)

const API = '/api';

// ===== HELPER =====
async function apiCall(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  return res.json();
}

// ===== AUTH =====
const Auth = {
  async login(idNumber, password) {
    return apiCall('POST', '/auth/login', { idNumber, password });
  },
  async register(data) {
    return apiCall('POST', '/auth/register', data);
  },
  async logout() {
    window.location.replace('/login.html');
  },
  async current() {
    const data = await apiCall('GET', '/auth/me');
    return data.user || null;
  },
  async isAdmin() {
    const u = await this.current();
    return u && u.role === 'admin';
  },
 async require(admin = false) {
  const u = await this.current();

  if (!u) {
    window.location.replace('/login.html');
    return null;
  }

  if (admin && u.role !== 'admin') {
    window.location.replace('/pages/student-dashboard.html');
    return null;
  }

  return u;
}
};
// ===== SIT-IN =====
const SitIn = {
  async getAll() { return apiCall('GET', '/sitins'); },
  async getActive() { return apiCall('GET', '/sitins/active'); },
  async getByStudent(idNumber) { return apiCall('GET', `/sitins/student/${idNumber}`); },
  async start(studentId, studentName, purpose, lab, pcNumber) {
    return apiCall('POST', '/sitins/start', { studentId, studentName, purpose, lab, pcNumber });
  },
  async end(sitinId) { return apiCall('POST', `/sitins/end/${sitinId}`); },

  formatTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },
  formatDuration(timeIn, timeOut) {
    const end = timeOut ? new Date(timeOut) : new Date();
    const diff = Math.floor((end - new Date(timeIn)) / 60000);
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
};

// ===== USERS =====
const Users = {
  async getAll() { return apiCall('GET', '/users'); },
  async find(idNumber) { return apiCall('GET', `/users/${idNumber}`); },
  async update(idNumber, data) { return apiCall('PUT', `/users/${idNumber}`, data); },
  async resetSessions(idNumber, count = 30) { return apiCall('POST', `/users/${idNumber}/reset-sessions`, { count }); }
};

// ===== ANNOUNCEMENTS =====
const Announcements = {
  async getAll() { return apiCall('GET', '/announcements'); },
  async post(title, message) { return apiCall('POST', '/announcements', { title, message }); },
  async delete(id) { return apiCall('DELETE', `/announcements/${id}`); }
};

// ===== FEEDBACK =====
const Feedback = {
  async getAll() { return apiCall('GET', '/feedback'); },
  async getByStudent(idNumber) { return apiCall('GET', `/feedback/${idNumber}`); },
  async post(studentId, studentName, message) { return apiCall('POST', '/feedback', { studentId, studentName, message }); }
};

// ===== REWARDS =====
const Rewards = {
  async getAll() { return apiCall('GET', '/rewards'); },
  async getByStudent(idNumber) { return apiCall('GET', `/rewards/${idNumber}`); },
  async add(studentId, points, reason) { return apiCall('POST', '/rewards', { studentId, points, reason }); },
  async getTotalPoints(idNumber) {
    const rewards = await this.getByStudent(idNumber);
    return rewards.reduce((sum, r) => sum + r.points, 0);
  }
};

// ===== PC RESERVATIONS =====
const PCReservations = {
  async getAll() { return apiCall('GET', '/reservations'); },
  async reserve(lab, pcNumber, studentId, minutes = 15) {
    return apiCall('POST', '/reservations', { lab, pcNumber, studentId, minutes });
  },
  async release(lab, pcNumber, studentId) {
    return apiCall('DELETE', `/reservations/${lab}/${pcNumber}/${studentId}`);
  }
};

// ===== ANALYTICS =====
const Analytics = {
  async get() { return apiCall('GET', '/analytics'); }
};

// ===== UI HELPERS =====
function showAlert(id, message, type = 'danger') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
  setTimeout(() => { el.className = 'alert'; }, 4000);
}

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

async function setNavUser() {
  const user = await Auth.current();
  if (!user) return;
  const el = document.getElementById('nav-user-name');
  if (el) el.textContent = user.firstName + ' ' + user.lastName;
}
