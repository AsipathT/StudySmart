import api from './api';

// Send group invite to a friend
export const sendGroupInvite = async (groupId, userId) => {
    try {
        const response = await api.post('/group-invites/send', { groupId, userId });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Accept group invite
export const acceptGroupInvite = async (inviteId) => {
    try {
        const response = await api.put(`/group-invites/accept/${inviteId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Reject group invite
export const rejectGroupInvite = async (inviteId) => {
    try {
        const response = await api.put(`/group-invites/reject/${inviteId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get my pending group invites
export const getMyGroupInvites = async () => {
    try {
        const response = await api.get('/group-invites/pending');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get sent invites for a specific group
export const getSentGroupInvites = async (groupId) => {
    try {
        const response = await api.get(`/group-invites/sent/${groupId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
