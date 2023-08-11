const express = require("express");
const router = express.Router();
const user = require("../controllers/userController");
const upload = require("../middleware/upload");

router.post("/register", upload.single('avatar'), user.register)
router.post("/login", user.login)
router.post("/oauth", upload.single('avatar'), user.oauth)
router.get("/search/:username/:userId", user.searchUser)
router.post("/follow/:id", user.followUser)
router.post("/unfollow/:userId", user.unfollowUser)
router.get("/connections/:userId", user.getUserConnections)
router.get("/profile/:id", user.profile)

module.exports = router;