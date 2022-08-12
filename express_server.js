const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca",
    userID: "h311o"
  },
  "9sm5xK": { 
    longURL: "http://www.google.com",
    userID: "h311o"
  }
};

const users = {
  "h311o": {
    id: 'h311o',
    email: 'email@email.com',
    password: '1111'
  }
};


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Post functions
// Create tiny URL
app.post("/urls", (req, res) => {

  const templateVars = { 
    user: req.cookies['user_id']
  };

  // Error message if user is not logged in and uses cURL to create URL 
  if (!templateVars.user) {
    return res.status(400).send('Please login to create tiny URLs!');
  }

  const shortURL = generateRandomString();

  // Create tiny URL and store with user's id
  urlDatabase[shortURL] = { 
    longURL: req.body.longURL,
    userID: req.cookies['user_id']
  };

  // console.log(urlDatabase);

  res.redirect(`/urls/${shortURL}`);
});


// Delete key and corresponding object from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  const id = urlDatabase[req.params.id];
  const user = req.cookies['user_id'];
  const url = urlsForUser(user, urlDatabase);

  if (!id) {
    return res.status(400).send('URL does not exist!');
  }

  if (!user) {
    return res.status(400).send('Please login to access URL!');
  }

  if (!url[req.params.id]) {
    return res.status(400).send('Not authorized!');
  }

  const templateVars = { 
    user: req.cookies['user_id']
  };

  if (!templateVars.user) {
    return res.status(400).send('Please login to delete URLs');
    // return res.redirect('/login');
  }
  
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {
  const id = urlDatabase[req.params.id];
  const user = req.cookies['user_id'];
  const url = urlsForUser(user, urlDatabase);

  if (!id) {
    return res.status(400).send('URL does not exist!');
  }

  if (!user) {
    return res.status(400).send('Please login to view URLs!');
  }

  if (!url[req.params.id]) {
    return res.status(400).send('Not authorized!');
  }
  
  urlDatabase[req.params.id].longURL = req.body.longURL;
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
  // console.log(users);

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
  
  // console.log(users);
  // console.log("email is: ", email);
  // console.log("password is: ", password);
  res.cookie("user_id", id);
  res.redirect("/urls");
});


// Get functions
// Root page
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

  const id = req.cookies['user_id'];

  const url = urlsForUser(id, urlDatabase);

   const templateVars = { 
    urls: url,
    user: users[req.cookies['user_id']] 
  };

  if (!templateVars.user) {
    // return res.status(400).send('Please login to access URLs!');
    return res.redirect('/login');
  }

    // console.log(templateVars.user);
  res.render("urls_index", templateVars);
  });
  
 

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  }

  if (!templateVars.user) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('Page not found!');
  }

  const id = req.cookies['user_id'];
  const url = urlsForUser(id, urlDatabase);
  const longURL = urlDatabase[req.params.id].longURL;

  // console.log('this is get/urls/id', req.params.id);

  const templateVars = { 
    id: req.params.id, 
    longURL: longURL,
    user: users[req.cookies['user_id']],
  };

  if (!templateVars.user) {
    // return res.redirect('/login');
    return res.status(400).send('Please login to view URLs!');
  }

  if (!url[templateVars.id]) {
    return res.status(400).send('You are not authorized to view this page!');
  }

  res.render("urls_show", templateVars);
});


// Shortened URLs will redirect to longURL site
app.get("/u/:id", (req, res) => {

  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(400).send('That URL does not exist!');
  }

  const longURL = url.longURL;

  res.redirect(longURL);
});


app.get("/register", (req, res) => {
  const templateVars = { 
    user: req.cookies['user_id']
  };

  if (templateVars.user) {
    return res.redirect("/urls");
  }

  res.render("urls_register", templateVars);
});


app.get("/login", (req, res) => {
  const templateVars = { 
    user: req.cookies['user_id']
  };
  // console.log('44444');
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  // console.log('5555');  
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
    if (userObj[key].email === testEmail) {
      return userObj[key];
    }  
  }
  return null;
};

// Helper function to return URLs that belong to a user
const urlsForUser = function(id, urls) {
  
  let urlsByUser = {};
  
  for (let key in urls) {

    // console.log(urls[key].userID);
  
    if (urls[key].userID === id) {

      urlsByUser[key] = urls[key];
    }
    // console.log(urlsByUser);
    
  } 
  return urlsByUser;
  
};