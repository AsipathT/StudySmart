import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    profileImage: '',
    degree: '',
    year: '',
    semester: '',
    availableTime: []
  });

  useEffect(() => {
    fetchProfile();
    fetchGroupSubjects();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        const imgUrl = data.profileImage || '';
        setFormData({
          profileImage: imgUrl,
          degree: data.degree || '',
          year: data.year || '',
          semester: data.semester || '',
          availableTime: data.availableTime || []
        });
        setImagePreview(imgUrl);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      availableTime: prev.availableTime.includes(time)
        ? prev.availableTime.filter(t => t !== time)
        : [...prev.availableTime, time]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setFormData(prev => ({
        ...prev,
        profileImage: base64String
      }));
    };
    reader.readAsDataURL(file);
  };
  const fetchGroupSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/studygroups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allGroups = data.studyGroups || [];
        const userId = user?._id || user?.id;

        // Filter groups where user is a member
        const myGroups = allGroups.filter(group =>
          group.members?.some(member =>
            (member._id === userId || member.id === userId || member === userId)
          )
        );

        // Extract unique subjects
        const subjects = [...new Set(myGroups.map(group => group.subject))];
        setGroupSubjects(subjects);
      }
    } catch (error) {
      console.error('Error fetching group subjects:', error);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setImagePreview(data.profileImage || '');
        setIsEditing(false);
        toast.success('Profile updated successfully!');

        // Update AuthContext so header profile icon updates immediately
        if (updateUser && user) {
          updateUser({
            ...user,
            profileImage: data.profileImage || ''
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        toast.error('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const imgUrl = profile?.profileImage || '';
    setImagePreview(imgUrl);
    setFormData({
      profileImage: imgUrl,
      degree: profile?.degree || '',
      year: profile?.year || '',
      semester: profile?.semester || '',
      availableTime: profile?.availableTime || []
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Profile Image Display */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-600"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                  {profile?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="space-y-6">
            {/* Profile Image Upload - only visible when editing */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
                >
                  <svg className="mx-auto h-10 w-10 text-indigo-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-indigo-600 font-medium">Click to upload a profile photo</p>
                  <p className="text-gray-400 text-sm mt-1">JPG, PNG or GIF (max 5MB)</p>
                  {imagePreview && (
                    <p className="text-green-600 text-sm mt-2 font-medium">✓ Image selected</p>
                  )}
                </div>
              </div>
            )}
            {/* Full Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile?.user?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Degree */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree
              </label>
              <select
                name="degree"
                value={formData.degree}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
              >
                <option value="">None</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Business Management">Business Management</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
              >
                <option value="">None</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
              >
                <option value="">None</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            {/* Subjects - from joined study groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects <span className="text-xs text-gray-400">(from your joined study groups)</span>
              </label>
              <div className="space-y-2">
                {groupSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {groupSubjects.map((subject, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full"
                      >
                        📚 {subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-3">No subjects yet — join study groups to see subjects here</p>
                )}
              </div>
            </div>

            {/* Available Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time
              </label>
              <div className="space-y-2">
                {['Morning', 'Evening', 'Weekend'].map((time) => (
                  <label key={time} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.availableTime.includes(time)}
                      onChange={() => handleTimeChange(time)}
                      disabled={!isEditing}
                      className={`w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    />
                    <span className="text-gray-700">{time}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
