import api from './api';

// Get all registered students
export const getAllStudents = async () => {
    try {
        const response = await api.get('/users/all');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

//Search students by subject

export const searchStudentsBySubject = async (subject) => {
    try {
        const response = await api.get(`/users/search?subject=${subject}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

//Search Students by subject and availability
//Why using post? Because we need to send more complex data (subject + availability) in the request body
export const searchStudentsByAvailability = async(searchData) => {
    try {
        const response = await api.post("/users/search/availability", searchData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }

};

// Update user profile
export const updateProfile = async (profileData) => {
    try {
        const response = await api.put("/users/profile", profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
