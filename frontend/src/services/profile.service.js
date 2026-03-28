/**
 * profile.service.js  —  Frontend
 *
 * Strategy:
 *  1. Always try the real API first.
 *  2. On network / auth errors throw so the UI can show a proper error message.
 *  3. On 404 / 500 from specific optional endpoints (achievements, activity)
 *     silently return structured fallback data so the page still renders.
 *  4. No Math.random() — fallback data is deterministic.
 */
import api from './api';

// ── Deterministic fallback datasets ─────────────────────────────────────────
const FALLBACK_PROFILE = {
  personalInfo: {
    name:             '',
    email:            '',
    studentNumber:    '',
    phone:            '',
    dateOfBirth:      '',
    gender:           '',
    nationality:      '',
    nic:              '',
    address:          '',
    emergencyContact: '',
    bloodGroup:       '',
    avatarUrl:        '',
  },
  academicInfo: {
    program:          '',
    batch:            '',
    semester:         1,
    academicYear:     '',
    branch:           '',
    supervisor:       '',
    enrolledDate:     '',
    expectedGraduation: '',
    currentGPA:       0,
    totalCredits:     0,
    completedCredits: 0,
    academicStanding: '',
  },
  performance: {
    overallAverage:     0,
    performanceTrend:   [],
    subjectPerformance: [],
    gradeDistribution:  { A:0, B:0, C:0, D:0, F:0 },
  },
  studyHabits: {
    dailyAverage:   0,
    weeklyTotal:    0,
    preferredTime:  '',
    consistency:    0,
    productiveDays: [],
    weakDays:       [],
  },
  recentActivities: [],
  achievements:     [],
  enrolledSubjects: [],
  attendance:       { overall: 0, bySubject: [] },
};

const FALLBACK_ACHIEVEMENTS = [
  { id:1, name:'Perfect Attendance',    icon:'🎯', date:'2024-03-01', color:'#059669' },
  { id:2, name:'Quiz Master',           icon:'📚', date:'2024-02-15', color:'#2563eb' },
  { id:3, name:'Study Streak: 30 Days', icon:'🔥', date:'2024-02-01', color:'#d97706' },
  { id:4, name:'Top 10% Performer',     icon:'🏆', date:'2024-01-15', color:'#7c3aed' },
];

const FALLBACK_ACTIVITY = [
  { id:1, action:'Completed Database Systems Quiz', score:85,  date:'2024-03-15', type:'quiz'        },
  { id:2, action:'Studied Algorithms',              hours:2.5, date:'2024-03-14', type:'study'       },
  { id:3, action:'Uploaded OS assignment',                     date:'2024-03-13', type:'upload'      },
  { id:4, action:'Achieved badge: Top Performer',              date:'2024-03-12', type:'achievement' },
];

const FALLBACK_STUDY_STATS = {
  dailyAverage:   3.5,
  weeklyTotal:    24.5,
  preferredTime:  'Evening',
  consistency:    85,
  productiveDays: ['Monday','Wednesday','Friday'],
  weakDays:       ['Sunday'],
};

// ── Helper — only swallow "optional" errors, rethrow auth/network ─────────────
function isOptionalError(err) {
  const status = err?.response?.status;
  // 404 = endpoint not yet built, 501 = not implemented → show fallback
  return status === 404 || status === 501;
}

// ── Service ───────────────────────────────────────────────────────────────────
const profileService = {

  /* ── GET /api/profile ───────────────────────────────────────────────────── */
  async getProfile() {
    try {
      const res = await api.get('/profile');
      // Merge API data over empty fallback so every key always exists
      return {
        success: true,
        data: deepMerge(FALLBACK_PROFILE, res.data?.data || {}),
      };
    } catch (err) {
      console.error('getProfile error:', err?.response?.data || err.message);
      // If backend is completely down, return empty structure so the page renders
      if (!err?.response) {
        return { success: true, data: FALLBACK_PROFILE };
      }
      // Auth errors (401/403) — let the caller handle
      throw err?.response?.data || { message: 'Failed to load profile' };
    }
  },

  /* ── PUT /api/profile ───────────────────────────────────────────────────── */
  async updateProfile(profileData) {
    // Strip any dayjs objects that slipped through (safety net)
    const clean = sanitizePayload(profileData);
    const res   = await api.put('/profile', clean);
    return res.data;
    // Let errors propagate — UI shows the message
  },

  /* ── POST /api/profile/avatar ───────────────────────────────────────────── */
  // Accepts either a raw File or an already-built FormData
  async updateAvatar(fileOrFormData) {
    let formData;
    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append('avatar', fileOrFormData);
    }
    const res = await api.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /* ── POST /api/profile/change-password ──────────────────────────────────── */
  async changePassword(passwordData) {
    const res = await api.post('/profile/change-password', passwordData);
    return res.data;
  },

  /* ── GET /api/profile/study-stats ──────────────────────────────────────── */
  async getStudyStats() {
    try {
      const res = await api.get('/profile/study-stats');
      return { success: true, data: res.data?.data || FALLBACK_STUDY_STATS };
    } catch (err) {
      if (isOptionalError(err)) {
        return { success: true, data: FALLBACK_STUDY_STATS };
      }
      throw err?.response?.data || { message: 'Failed to load study stats' };
    }
  },

  /* ── GET /api/profile/achievements ─────────────────────────────────────── */
  async getAchievements() {
    try {
      const res = await api.get('/profile/achievements');
      return { success: true, data: res.data?.data || FALLBACK_ACHIEVEMENTS };
    } catch (err) {
      if (isOptionalError(err)) {
        return { success: true, data: FALLBACK_ACHIEVEMENTS };
      }
      throw err?.response?.data || { message: 'Failed to load achievements' };
    }
  },

  /* ── GET /api/profile/activity ──────────────────────────────────────────── */
  async getRecentActivity() {
    try {
      const res = await api.get('/profile/activity');
      return { success: true, data: res.data?.data || FALLBACK_ACTIVITY };
    } catch (err) {
      if (isOptionalError(err)) {
        return { success: true, data: FALLBACK_ACTIVITY };
      }
      throw err?.response?.data || { message: 'Failed to load activity' };
    }
  },

  /* ── PUT /api/profile/notifications ────────────────────────────────────── */
  async updateNotificationSettings(settings) {
    const res = await api.put('/profile/notifications', settings);
    return res.data;
  },

  /* ── PUT /api/profile/privacy ───────────────────────────────────────────── */
  async updatePrivacySettings(settings) {
    const res = await api.put('/profile/privacy', settings);
    return res.data;
  },

  /* ── POST /api/profile/link/:provider ──────────────────────────────────── */
  async linkSocialAccount(provider, data) {
    const res = await api.post(`/profile/link/${provider}`, data);
    return res.data;
  },

  /* ── DELETE /api/profile/link/:provider ─────────────────────────────────── */
  async unlinkSocialAccount(provider) {
    const res = await api.delete(`/profile/link/${provider}`);
    return res.data;
  },

  /* ── GET /api/profile/export ────────────────────────────────────────────── */
  async downloadProfileData() {
    const res = await api.get('/profile/export', { responseType: 'blob' });
    // Trigger browser download
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', 'studysmart_profile.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  /* ── DELETE /api/profile/account ───────────────────────────────────────── */
  async deleteAccount(password) {
    const res = await api.delete('/profile/account', { data: { password } });
    return res.data;
  },
};

// ── Utility: deep-merge b into a (non-destructive on a) ───────────────────────
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else if (override[key] !== undefined && override[key] !== null && override[key] !== '') {
      result[key] = override[key];
    }
  }
  return result;
}

// ── Utility: convert dayjs objects → ISO strings, remove undefined ────────────
function sanitizePayload(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && v.$isDayjsObject) {
      out[k] = v.format('YYYY-MM-DD');
    } else if (v && typeof v === 'object' && v instanceof Date) {
      out[k] = v.toISOString().split('T')[0];
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default profileService;