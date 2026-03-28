import api from './api';

class ProfileService {
  /**
   * Get user profile data
   */
  async getProfile() {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      // Return mock data for development
      return {
        success: true,
        data: generateMockProfileData()
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Update avatar
   */
  async updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await api.post('/profile/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get study statistics
   */
  async getStudyStats() {
    try {
      const response = await api.get('/profile/study-stats');
      return response.data;
    } catch (error) {
      console.error('Get study stats error:', error);
      return {
        success: true,
        data: {
          dailyAverage: 3.5,
          weeklyTotal: 24.5,
          preferredTime: 'Evening',
          consistency: 85,
          productiveDays: ['Monday', 'Wednesday', 'Friday'],
          weakDays: ['Sunday']
        }
      };
    }
  }

  /**
   * Get achievements
   */
  async getAchievements() {
    try {
      const response = await api.get('/profile/achievements');
      return response.data;
    } catch (error) {
      console.error('Get achievements error:', error);
      return {
        success: true,
        data: [
          { id: 1, name: 'Perfect Attendance', icon: '🎯', date: '2024-03-01', color: '#52c41a' },
          { id: 2, name: 'Quiz Master', icon: '📚', date: '2024-02-15', color: '#1890ff' },
          { id: 3, name: 'Study Streak: 30 Days', icon: '🔥', date: '2024-02-01', color: '#faad14' },
          { id: 4, name: 'Top 10% Performer', icon: '🏆', date: '2024-01-15', color: '#722ed1' }
        ]
      };
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    try {
      const response = await api.get('/profile/activity');
      return response.data;
    } catch (error) {
      console.error('Get activity error:', error);
      return {
        success: true,
        data: [
          { id: 1, action: 'Completed Database Systems Quiz', score: 85, date: '2024-03-15', type: 'quiz' },
          { id: 2, action: 'Studied Algorithms', hours: 2.5, date: '2024-03-14', type: 'study' },
          { id: 3, action: 'Uploaded assignment', subject: 'Operating Systems', date: '2024-03-13', type: 'upload' },
          { id: 4, action: 'Achieved new badge: Top Performer', date: '2024-03-12', type: 'achievement' }
        ]
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/profile/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings) {
    try {
      const response = await api.put('/profile/privacy', settings);
      return response.data;
    } catch (error) {
      console.error('Update privacy settings error:', error);
      throw error;
    }
  }

  /**
   * Link social account
   */
  async linkSocialAccount(provider, data) {
    try {
      const response = await api.post(`/profile/link/${provider}`, data);
      return response.data;
    } catch (error) {
      console.error('Link social account error:', error);
      throw error;
    }
  }

  /**
   * Unlink social account
   */
  async unlinkSocialAccount(provider) {
    try {
      const response = await api.delete(`/profile/link/${provider}`);
      return response.data;
    } catch (error) {
      console.error('Unlink social account error:', error);
      throw error;
    }
  }

  /**
   * Download profile data
   */
  async downloadProfileData() {
    try {
      const response = await api.get('/profile/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download profile error:', error);
      throw error;
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(password) {
    try {
      const response = await api.delete('/profile/account', {
        data: { password }
      });
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
}

// Helper function to generate mock profile data
const generateMockProfileData = () => {
  const branches = ['Kandy', 'Malabe', 'Jaffna', 'Matara', 'Kollupitiya', 'Colombo City Uni'];
  const subjects = ['Database Systems', 'Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'Machine Learning'];
  
  // Academic performance over time
  const performanceTrend = [];
  for (let i = 0; i < 6; i++) {
    performanceTrend.push({
      month: `Month ${i + 1}`,
      score: 65 + Math.random() * 25,
      target: 75
    });
  }

  // Subject-wise performance
  const subjectPerformance = subjects.map(subject => ({
    subject,
    score: 60 + Math.random() * 35,
    grade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)],
    attempts: 1 + Math.floor(Math.random() * 3),
    status: Math.random() > 0.2 ? 'Pass' : 'Fail'
  }));

  return {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      studentNumber: 'STU2024001',
      phone: '+94 77 123 4567',
      dateOfBirth: '1998-05-15',
      gender: 'Male',
      nationality: 'Sri Lankan',
      nic: '982345678V',
      address: '123, Main Street, Kandy',
      emergencyContact: '+94 71 234 5678',
      bloodGroup: 'O+'
    },
    academicInfo: {
      program: 'BSc in Computer Science',
      batch: '2024',
      semester: 3,
      academicYear: '2nd Year',
      branch: branches[Math.floor(Math.random() * branches.length)],
      supervisor: 'Dr. Kamal Perera',
      enrolledDate: '2022-09-01',
      expectedGraduation: '2026-08-31',
      currentGPA: 3.65,
      totalCredits: 45,
      completedCredits: 30,
      academicStanding: 'Good Standing'
    },
    performance: {
      overallAverage: 76.5,
      currentGPA: 3.65,
      totalCredits: 45,
      completedCourses: 10,
      inProgressCourses: 4,
      performanceTrend,
      subjectPerformance,
      gradeDistribution: {
        A: 4,
        B: 5,
        C: 1,
        D: 0,
        F: 0
      }
    },
    studyHabits: {
      dailyAverage: 3.5,
      weeklyTotal: 24.5,
      preferredTime: 'Evening',
      consistency: 85,
      productiveDays: ['Monday', 'Wednesday', 'Friday'],
      weakDays: ['Sunday']
    },
    recentActivities: [
      { id: 1, action: 'Completed Database Systems Quiz', score: 85, date: '2024-03-15', type: 'quiz' },
      { id: 2, action: 'Studied Algorithms', hours: 2.5, date: '2024-03-14', type: 'study' },
      { id: 3, action: 'Uploaded assignment', subject: 'Operating Systems', date: '2024-03-13', type: 'upload' },
      { id: 4, action: 'Achieved new badge: Top Performer', date: '2024-03-12', type: 'achievement' }
    ],
    achievements: [
      { id: 1, name: 'Perfect Attendance', icon: '🎯', date: '2024-03-01', color: '#52c41a' },
      { id: 2, name: 'Quiz Master', icon: '📚', date: '2024-02-15', color: '#1890ff' },
      { id: 3, name: 'Study Streak: 30 Days', icon: '🔥', date: '2024-02-01', color: '#faad14' },
      { id: 4, name: 'Top 10% Performer', icon: '🏆', date: '2024-01-15', color: '#722ed1' }
    ],
    enrolledSubjects: [
      { code: 'IT3060', name: 'Human Computer Interaction', credits: 3, schedule: 'Mon 10-12', room: 'LAB 101' },
      { code: 'IT3070', name: 'Machine Learning', credits: 3, schedule: 'Tue 14-16', room: 'LH 205' },
      { code: 'IT3080', name: 'Cloud Computing', credits: 3, schedule: 'Wed 09-11', room: 'LAB 103' },
      { code: 'IT3090', name: 'Mobile App Development', credits: 3, schedule: 'Thu 13-15', room: 'LAB 102' }
    ],
    attendance: {
      overall: 92,
      bySubject: [
        { subject: 'IT3060', percentage: 95 },
        { subject: 'IT3070', percentage: 88 },
        { subject: 'IT3080', percentage: 92 },
        { subject: 'IT3090', percentage: 93 }
      ]
    }
  };
};

export default new ProfileService();