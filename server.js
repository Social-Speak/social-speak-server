const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");
const user = require("./app/routers/userRouter");
const messageRoutes = require("./app/routers/messageRouter");
const bodyParser = require("body-parser");

const app = express();

const corsOrigin = {
  origin: "*",
};

app.use(cors(corsOrigin));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect to database
const DB = process.env.MONGO_URL || "test";
mongoose
  .connect(DB, {
    usenewurlparser: true,
    useunifiedtopology: true,
  })
  .then(() => {
    console.log("Successfully connected ");
  })
  .catch((error) => {
    console.log(`can not connect to database, ${error}`);
  });

app.use("/", user);
app.use("/messages", messageRoutes);

const server = app.listen(process.env.PORT, "0.0.0.0", () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
