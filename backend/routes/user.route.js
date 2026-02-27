const express = require("express");
const router = express.Router();

const{

    getAllStudents,
    searchUsersBySubject,
    searchUsersByAvailability,
    updateProfile,
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");

//All routes are protected(require authentication)
router.get("/all", authMiddleware, getAllStudents);
router.get("/search", authMiddleware, searchUsersBySubject);
router.post("/search/availability", authMiddleware, searchUsersByAvailability);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;