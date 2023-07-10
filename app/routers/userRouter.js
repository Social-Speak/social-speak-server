const express = require("express");
const user = require("../controllers/userController");
const router = express.Router();

router.post("/register", user.register)
router.post("/login", user.login)
router.post("/oauth", user.oauth)
router.post("/search/:username/:userId", user.searchUser)
router.post("/follow/:id", user.followUser)
router.post("/unfollow/:userId", user.unfollowUser)
router.get("/connections/:userId", user.getUserConnections)
router.get("/profile/:id", user.profile)

module.exports = router;