const express = require('express');
const router = express.Router();

const {
    createStudyGroup,
    getAllStudyGroups,
    getStudyGroupById,
    updateStudyGroup,
    deleteStudyGroup,
    searchStudyGroupsBySubject,
    searchStudyGroupsByAvailability,
    joinStudyGroup,
    leaveStudyGroup,

} = require("../controllers/studygroup.controller");

const authMiddleware = require("../middleware/auth.middleware");

//All routes are protected(require authentication)

//Create a study group
router.post("/", authMiddleware, createStudyGroup);

//Get all study groups
router.get("/", authMiddleware, getAllStudyGroups);

//Search study groups by subject(Query Params)
router.get("/search", authMiddleware, searchStudyGroupsBySubject);

//Search study groups by subject and availability(Post request body)
router.post("/search/availability", authMiddleware, searchStudyGroupsByAvailability);

//Get Single study group by ID
router.get("/:id", authMiddleware, getStudyGroupById);

//Update a study group(only creator can update)
router.put("/:id", authMiddleware, updateStudyGroup);

//Delete a study group(only creator can delete)
router.delete("/:id", authMiddleware, deleteStudyGroup);

//Join a study group
router.post("/:id/join", authMiddleware, joinStudyGroup);

//Leave a study group
router.post("/:id/leave", authMiddleware, leaveStudyGroup);

module.exports = router;



