const generateLogToken = require("../../jwt");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

// get token
const extractToken = (headers) => {
  const getToken = headers.authorization;
  if (getToken && getToken.startsWith("Bearer ")) {
    return getToken.substring(7);
  } else {
    return getToken;
  }
};

// genereate random password
function generateRandomPassword(length) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

// create account
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with the provided email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (req.file) {
      newUser.avatar = req.file.path;
    }

    await newUser.save();
    res.status(201).json({ message: "Success create account" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// login
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email" });
    }

    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      return res.status(404).json({ message: "Invalid password" });
    }

    res.send({
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      token: generateLogToken(user),
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// oauth
exports.oauth = async (req, res) => {
  const password = generateRandomPassword(10);
  try {
    const { username, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(201).json({
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        password: existingUser.password,
        token: generateLogToken(existingUser),
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (req.file) {
      newUser.avatar = req.file.path;
    }

    const savedUser = await newUser.save();
    res.status(201).json({
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      password: savedUser.password,
      token: generateLogToken(savedUser),
      avatar: savedUser.avatar,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while registering the user" });
  }
};

// search user
exports.searchUser = async (req, res) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const input = req.params.username.toLowerCase();
      const users = await User.find({ username: { $regex: input } });

      const userId = req.params.userId; // User ID yang sedang melakukan pencarian
      const data = users.slice(0, 5);
      const result = data.map((user) => ({
        username: user.username,
        email: user.email,
        isFollowed: user.following.includes(userId), // Menambahkan flag isFollowed berdasarkan pengguna yang sedang mencari
        avatar: user.avatar,
      }));

      res.json(result);
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    res.status(500).json({ error: "Gagal mengambil data dari database" });
  }
};

// follow
exports.followUser = async (req, res) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const { id } = req.params;
      const { userId } = req.body;

      const userToFollow = await User.findById(id);
      const userFollowing = await User.findById(userId);

      if (!userToFollow || !userFollowing) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }

      userToFollow.following.push(userId);
      await userToFollow.save();

      res.status(200).json({ message: "Berhasil mengikuti pengguna" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error" });
  }
};

// unfollow
exports.unfollowUser = async (req, res) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const { userId } = req.params;
      const { otherUserId } = req.body;

      const user = await User.findById(userId);
      const otherUser = await User.findById(otherUserId);

      if (!user || !otherUser) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }

      // Menghapus otherUserId dari following pengguna userId
      user.following = user.following.filter(
        (followedUserId) => followedUserId.toString() !== otherUserId
      );
      await user.save();

      res.status(200).json({ message: "Berhasil unfollow pengguna" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat unfollow pengguna" });
  }
};

// get follow
exports.getUserConnections = async (req, res) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const { userId } = req.params;

      const user = await User.findById(userId).populate(
        "following",
        "username email"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const followers = await User.find(
        { following: userId },
        "username email"
      );

      res.status(200).json({
        followers,
        following: user.following,
        avatar: user.avatar,
      });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve user connections" });
  }
};

// get profile
exports.profile = async (req, res) => {
  const token = extractToken(req.headers);
  const { id } = req.params;
  try {
    if (token) {
      const data = await User.findById(id);

      res.status(200).json(data);
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
