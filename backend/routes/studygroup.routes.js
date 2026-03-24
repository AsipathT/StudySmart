const express = require('express');
const router = express.Router();

const {
    createStudyGroup,
    getAllStudyGroups,
    getStudyGroupById,
    updateStudyGroup,
    updateStudyGroupImage,
    deleteStudyGroup,
    searchStudyGroupsBySubject,
    searchStudyGroupsByAvailability,
    joinStudyGroup,
    leaveStudyGroup,

} = require("../controllers/studygroup.controller");

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

//All routes are protected(require authentication)

//Create a study group (with optional image upload)
router.post("/", authMiddleware, upload.single('image'), createStudyGroup);

//Get all study groups
router.get("/", authMiddleware, getAllStudyGroups);

//Search study groups by subject(Query Params)
router.get("/search", authMiddleware, searchStudyGroupsBySubject);

//Search study groups by subject and availability(Post request body)
router.post("/search/availability", authMiddleware, searchStudyGroupsByAvailability);

//Get Single study group by ID
router.get("/:id", authMiddleware, getStudyGroupById);

//Update a study group(only creator can update) - with optional image
router.put("/:id", authMiddleware, upload.single('image'), updateStudyGroup);

//Update study group image only
router.put("/:id/image", authMiddleware, upload.single('image'), updateStudyGroupImage);

//Delete a study group(only creator can delete)
router.delete("/:id", authMiddleware, deleteStudyGroup);

//Join a study group
router.post("/:id/join", authMiddleware, joinStudyGroup);

//Leave a study group
router.post("/:id/leave", authMiddleware, leaveStudyGroup);

module.exports = router;



