const bcrypt = require("bcryptjs");

// Choose your new password (remember this!)
const newPassword = "Skoda@321"; // Change to whatever you want
const saltRounds = 12;

const hash = bcrypt.hashSync(newPassword, saltRounds);
console.log("New password:", newPassword);
console.log("New hash:", hash);
