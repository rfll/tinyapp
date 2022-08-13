const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: '1Gdj72'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: '1Gdj72'
  }
};
const users = {
  '1Gdj72': {
    id: '1Gdj72',
    email: 'email@email.com',
    password: '$2a$10$.bRtwIYdHqAbd4ZLJNJpHuObUJCI4I/mI/fkrtXIyGY6yEm8oVt/O'
  }
};

// Post functions
// Create tiny URL
app.post("/urls", (req, res) => {
  const user = req.session['user_id'];
  // Error message if user is not logged in and uses cURL to create URL
  if (!user) {
    return res.status(400).send('Please login to create tiny URLs!');
  }
  const shortURL = generateRandomString();
  // Create tiny URL and store with user's id
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: user
  };
  res.redirect(`/urls/${shortURL}`);
});

// Delete url from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  const id = urlDatabase[req.params.id];
  const user = req.session['user_id'];
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
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Edit url
app.post("/urls/:id", (req, res) => {
  const id = urlDatabase[req.params.id];
  const user = req.session['user_id'];
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

// Login email/pass verification, cookie creation
app.post("/login", (req, res) => {
  const enterEmail = req.body.email;
  const enterPassword = req.body.password;
  
  if (!getUserByEmail(enterEmail, users)) {
    return res.status(403).send('Account does not exist. Please register!');
  }

  const findPassword = getUserByEmail(enterEmail, users).password;

  if (!bcrypt.compareSync(enterPassword, findPassword)) {
    return res.status(403).send('Invalid password!');
  }

  const findID = getUserByEmail(enterEmail, users).id;

  users[findID] = {
    id: findID,
    email: enterEmail,
    password: findPassword
  };
  req.session['user_id'] = users[findID].id;
  res.redirect("/urls");
});

// Logout and cookie removal
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Register email/pass creation/storage and cookie creation
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const enterEmail = req.body.email;
  const enterPassword = req.body.password;

  if (!enterEmail) {
    return res.status(403).send('Please enter a valid email!');
  }
  if (!enterPassword) {
    return res.status(403).send('Please enter a password!');
  }
  if (getUserByEmail(enterEmail, users)) {

    return res.status(409).send('Account already registered. Please login!');
  }
  const hashedPassword = bcrypt.hashSync(enterPassword, 10);

  users[id] = { id, email: enterEmail, password: hashedPassword };
  
  req.session['user_id'] = users[id].id;
  res.redirect("/urls");
});


// Get functions
// Url index
app.get("/urls", (req, res) => {
  const id = req.session['user_id'];
  const url = urlsForUser(id, urlDatabase);

  const templateVars = {
    urls: url,
    user: users[id]
  };
  if (!templateVars.user) {
    // return res.status(400).send('Please login to access URLs!');
    return res.redirect('/login');
  }
  res.render("urls_index", templateVars);
});
  

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']]
  };
  if (!templateVars.user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// Edit/newly created url page
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(400).send('Page not found!');
  }
  const id = req.session['user_id'];
  const url = urlsForUser(id, urlDatabase);
  const longURL = urlDatabase[req.params.id].longURL;
  
  const templateVars = {
    id: req.params.id,
    longURL: longURL,
    user: users[id],
  };
  if (!templateVars.user) {
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
    user: req.session['user_id']
  };
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});


app.get("/login", (req, res) => {
  const templateVars = {
    user: req.session['user_id']
  };
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});