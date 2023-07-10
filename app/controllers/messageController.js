const Messages = require("../models/message");

// get token
const extractToken = (headers) => {
  const getToken = headers.authorization;
  if (getToken && getToken.startsWith("Bearer ")) {
    return getToken.substring(7);
  } else {
    return getToken;
  }
};

module.exports.getMessages = async (req, res, next) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const { from, to } = req.body;

      const messages = await Messages.find({
        users: {
          $all: [from, to],
        },
      }).sort({ updatedAt: 1 });

      const projectedMessages = messages.map((msg) => {
        return {
          fromSelf: msg.sender.toString() === from,
          message: msg.message.text,
        };
      });
      res.json(projectedMessages);
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  const token = extractToken(req.headers);
  try {
    if (token) {
      const { from, to, message } = req.body;
      const data = await Messages.create({
        message: { text: message },
        users: [from, to],
        sender: from,
      });

      if (data) return res.json({ msg: "Message added successfully." });
      else return res.json({ msg: "Failed to add message to the database" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  } catch (ex) {
    next(ex);
  }
};
