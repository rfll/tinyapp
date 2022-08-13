// Helper function to search for user email
const getUserByEmail = function(userEmail, userObj) {
  for (let key in userObj) {
    if (userObj[key].email === userEmail) {
      return userObj[key];
    }  
  }
  return null;
};


// Helper function to return URLs that belong to a user
const urlsForUser = function(id, urls) {
  let urlsByUser = {};
  
  for (let key in urls) {
  
    if (urls[key].userID === id) {
      urlsByUser[key] = urls[key];
    }
  } 
  return urlsByUser;
};


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


module.exports = { getUserByEmail, urlsForUser, generateRandomString };