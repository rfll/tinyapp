const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};


// const templateVars = {
//   username: req.cookies["username"],
//   // ... any other vars
// };
// res.render("urls_index", templateVars);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  // console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

// Delete key-value pair from urlDatabase when delete button clicked
app.post("/urls/:id/delete", (req, res) => {
  // console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  // console.log(req.body);
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // const id = generateRandomString();
  const enterEmail = req.body.email;
  const enterPassword = req.body.password;

  const findEmail = getUserByEmail(enterEmail, users);
  const findPassword = getUserByEmail(enterEmail, users).password;
  const findID = getUserByEmail(enterEmail, users).id;

  if (!getUserByEmail(enterEmail, users)) {

    return res.sendStatus(403);
  } 
  
  if (findPassword !== enterPassword) {

    return res.sendStatus(403);
  } 
  
  users[findID] = { id: findID, email: enterEmail, password: findPassword };
  console.log(users);

  res.cookie("user_id", findID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const templateVars = {
    user: req.cookies['user_id']
  };
  // console.log(templateVars);
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const enterEmail = req.body.email;
  const enterPassword = req.body.password;

  if (!enterEmail) {
    return res.sendStatus(403);
  }
  if (!enterPassword) {
    return res.sendStatus(403);
  }
  
  if (getUserByEmail(enterEmail, users)) {

    return res.sendStatus(409);
  }

  users[id] = { id, email: enterEmail, password: enterPassword};
  
  console.log(users);
  // console.log("email is: ", email);
  // console.log("password is: ", password);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: users[req.cookies['user_id']] };

    // console.log(templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  const templateVars = { id: req.params.id, longURL: longURL,
    user: users[req.cookies['user_id']] };

  res.render("urls_show", templateVars);
});

// Shortened URLs will redirect to longURL site
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { 
    user: req.cookies['user_id']
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.cookies['user_id']
  };
  res.render("urls_login", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// Generate a string of 6 random characters
const generateRandomString = function() {
  const characters = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  let randomString = '';
  let arrayToHoldChars = [];

  for (let char = 0; char < 6; char++) {
    arrayToHoldChars.push(characters.charAt(Math.floor(Math.random() *  characters.length)));
  
  }
  randomString = arrayToHoldChars.join('');
  return randomString;
};


// Helper function to search for user email
const getUserByEmail = function(testEmail, userObj) {
  for (let key in userObj) {
    if (users[key].email === testEmail) {
      return users[key];
    }  
  }
  return null;
};

// // Helper function to search for user password
// const getUserPassword = function(testEmail, userObj) {
//   for (let key in userObj) {
//     if (users[key].email === testEmail) {
//       return users[key].password;
//     }  
//   }
//   return null;
// };