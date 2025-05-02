// Core Module
const path = require('path');
const fs = require('fs');

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const multer = require('multer');

require('dotenv').config();
const DB_path = process.env.MONGO_URI;

// MongoDB Connection String
// const DB_path = "mongodb+srv://arihant:arihant@airbnb.lln8oaz.mongodb.net/airbnb?retryWrites=true&w=majority&appName=airbnb";

// Local Module
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_path,
  collection: 'sessions'
});

// Ensure 'uploads' folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Helper function to generate random string
const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Sanitize filename
const sanitizeFilename = (name) => name.replace(/[^a-z0-9.]/gi, '_');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const cleanName = sanitizeFilename(file.originalname);
    cb(null, randomString(10) + '-' + cleanName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const multerOptions = { storage, fileFilter };

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')));

// Session middleware
app.use(session({
  secret: "arihant",
  resave: false,
  saveUninitialized: true,
  store
}));

// Custom middleware to expose login state
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

// Routers
app.use(authRouter);
app.use(storeRouter);

// Route protection for /host
app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/host", hostRouter);

// 404 handler
app.use(errorsController.pageNotFound);

// Start server
const PORT = 3003;

mongoose.connect(DB_path)
  .then(() => {
    console.log('Connected to Mongo');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error while connecting to Mongo:', err);
  });
