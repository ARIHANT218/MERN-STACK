const express = require("express");
const authRouter = express.Router();

// Local Module
const authController = require("../controllers/authController");

authRouter.get("/login", authController.getLogin);
authRouter.post("/login", authController.postLogin);

authRouter.get("/signUp", authController.getsignUp);
authRouter.post("/signUp", authController.postsignUp);
authRouter.post("/logout", authController.postLogout);
module.exports = authRouter;