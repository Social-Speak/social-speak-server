const path = require("path");
const multer = require("multer");


let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); 
  },
});

let upload = multer({
  storage: storage,
  filefilter: function (req, file, callback) {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg") {
      callback(null, true);
    } else {
      console.log("only jpg & png file suppi");
      callback(null, false);
    }
  },
  limits: {
    filesize: 1024 * 1024 * 2,
  },
});


module.exports = upload;
