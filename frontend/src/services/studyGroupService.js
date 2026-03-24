import api from "./api";


//Get all study groups
export const getAllStudyGroups = async () => {
    try {
        const response = await api.get("/studygroups");
        return response.data;
    } catch (error){
        throw error.response?.data || error.message;
    }
};


//Get Single study group by ID
export const getStudyGroupById = async (id) => {
    try {
        const response = await api.get(`/studygroups/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


//create new study Group
export const createStudyGroup = async (groupData) => {
    try {
        const config = {};
        // If it's FormData (for file uploads), set proper content type
        if (groupData instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data',
            };
        }
        
        const response = await api.post("/studygroups", groupData, config);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

//Update a study group(only creator can update)
export const updateStudyGroup = async (id, groupData) => {
  try {
    const config = {};
    // If it's FormData (for file uploads), set proper content type
    if (groupData instanceof FormData) {
        config.headers = {
            'Content-Type': 'multipart/form-data',
        };
    }
    
    const response = await api.put(`/studygroups/${id}`, groupData, config);
    return response.data;
  } catch (error){
     throw error.response?.data || error.message;
  }
};


//Delete study group(only creator can delete)
export const deleteStudyGroup = async (id) => {
  try {
    const response = await api.delete(`/studygroups/${id}`);
    return response.data;

  } catch (error) {
    throw error.response?.data || error.message;
  }

};

//Search study groups by subject
export const searchStudyGroupsBySubject = async(subject) => {
    try {
        const response = await api.get(`/studygroups/search?subject=${subject}`);
        return response.data;

    } catch (error) {
        throw error.response?.data || error.message;
    }
};

//Search study groups by availability
export const searchStudyGroupsByAvailability = async(searchData) => {
    try {

        const response = await api.post("/studygroups/search/availability", searchData);
        return response.data;
        
    } catch (error){
        throw error.response?.data || error.message;
    }
};

//Join a study group
export const joinStudyGroup = async (id) => {
  try {
    const response = await api.post(`/studygroups/${id}/join`);
    return response.data;

  } catch (error){
    throw error.response?.data || error.message;
  }

};

//Leave a study group
export const leaveStudyGroup = async (id) => {

    try {
        const response = await api.post(`/studygroups/${id}/leave`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }

};