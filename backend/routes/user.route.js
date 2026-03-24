const express = require("express");
const router = express.Router();

const {

    getAllStudents,
    searchUsersBySubject,
    searchUsersByAvailability,
    updateProfile,
    uploadProfileImage,
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");
const profileUpload = require("../middleware/profileUpload.middleware");

//All routes are protected(require authentication)
router.get("/all", authMiddleware, getAllStudents);
router.get("/search", authMiddleware, searchUsersBySubject);
router.post("/search/availability", authMiddleware, searchUsersByAvailability);
router.put("/profile", authMiddleware, updateProfile);
router.post("/profile/upload-image", authMiddleware, profileUpload.single('profileImage'), uploadProfileImage);

module.exports = router;
