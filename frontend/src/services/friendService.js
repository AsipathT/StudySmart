import api from './api';

// Send friend request
export const sendFriendRequest = async (userId) => {
    try {
        const response = await api.post(`/friends/request/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
    try {
        const response = await api.put(`/friends/accept/${requestId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
    try {
        const response = await api.put(`/friends/reject/${requestId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get my friends
export const getMyFriends = async () => {
    try {
        const response = await api.get('/friends');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get pending friend requests (received)
export const getPendingRequests = async () => {
    try {
        const response = await api.get('/friends/pending');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get sent friend requests
export const getSentRequests = async () => {
    try {
        const response = await api.get('/friends/sent');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Remove friend
export const removeFriend = async (requestId) => {
    try {
        const response = await api.delete(`/friends/${requestId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get friend statuses map for UI
export const getFriendStatuses = async () => {
    try {
        const response = await api.get('/friends/status');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
