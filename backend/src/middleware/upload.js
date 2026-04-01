const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});


const fileFilter = (req, file, cb) => {
  // Accept only CSV or PDF files
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/pdf' ||
    file.originalname.match(/\.csv$/i) ||
    file.originalname.match(/\.pdf$/i)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV or PDF files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
