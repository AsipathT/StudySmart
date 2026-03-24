require("dotenv").config();
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// Root Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API is running successfully 🚀",
  });
});

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use("/api/studygroups", require("./routes/studygroup.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/friends", require("./routes/friend.routes"));
app.use("/api/group-invites", require("./routes/groupInvite.routes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
