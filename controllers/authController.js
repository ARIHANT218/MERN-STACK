const { check ,validationResult} = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");


exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errorMessage: [],
    oldInput: { email: "", password: "" },
    user :{}
    
  });
}

exports.postLogin = async (req, res, next) => {
  
  req.session.isLoggedIn = true; // Set the session variable to true
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) { 
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errorMessage: ["User Doesn't exist"],
      oldInput: { email, password },
      user:{}
    });
  }
  const isEqual = await bcrypt.compare(password,user.password);
  if (!isEqual) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errorMessage: ["Invalid Password"],
      oldInput: { email, password },
      user:{}
    });
  }
  req.session.isLoggedIn = true; 
  req.session.user = user; 
  await req.session.save(); // Save the session to the database
  res.redirect("/"); // Redirect to the home page or any other page

}

exports.getsignUp = (req, res, next) => {
  res.render("auth/signUp", {
    pageTitle: "signUp",
    currentPage: "signUp",
    isLoggedIn: false,
    errorMessage: [],
    oldInput: { firstName: "",lastName: "",email: "",password: "",userType: "" },
    user:{}
  });
}


exports.postsignUp= [
  check("firstName").isLength({ min: 3 }).withMessage("First name must be at least 3 characters long."),
  check("lastName").isLength({ min: 3 }).withMessage("Last name must be at least 3 characters long."),
  check("email").isEmail().withMessage("Please enter a valid email address."),
  
  check("password")
  .isLength({min: 5})
  .withMessage("Password should be atleast 5 characters long")
  .matches(/[A-Z]/)
  .withMessage("Password should contain atleast one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password should contain atleast one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password should contain atleast one number")
  .matches(/[!@&]/)
  .withMessage("Password should contain atleast one special character")
  .trim(),

  // check("confirmPassword")
  // .trim()
  // .custom((value, {req}) => {
  //   if (value !== req.body.password) {
  //     throw new Error("Passwords do not match");
  //   }
  //   return true;
  // }),

  check("userType")
  .notEmpty()
  .withMessage("Please select a user type")
  .isIn(['guest', 'host'])
  .withMessage("Invalid user type"),

    check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value, {req}) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }
      return true;
    }),
    

  (req, res, next) => {
    
        const {firstName, lastName, email, password, userType} = req.body;  
        const err = validationResult(req);
        if (!err.isEmpty()) {
            console.log(err.array());
            return res.status(422).render("auth/signUp", {
                pageTitle: "signUp",
                currentPage: "signUp",
                isLoggedIn: false,
                errorMessage: err.array().map(err => err.msg),
                oldInput: {firstName, lastName, email, password, userType},
                user:{}
               
            });
        }
        bcrypt.hash(password, 12).then((hashedPassword) => {
          const user = new User({ firstName, lastName, email, password: hashedPassword, userType });

        return user.save();   
      }).then(() => {
        console.log("User Created successfully"); 
        res.redirect("/login");})
      .catch((err) => {
        console.log(err);
        res.redirect("/signUp");
      }
    )      
}]


exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  })
}