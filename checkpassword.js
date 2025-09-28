const bcrypt = require("bcryptjs");

const hashes = [
  "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBHBnHS/LHSQS2",
  "$2a$12$j5JDz/MFYY9GxGq1h.jmHu9PKOt04b7oEGjsf0nvPfyz/JF9l0LZy",
];

const passwordToTest = "admin123"; // try with candidate passwords

hashes.forEach(hash => {
  bcrypt.compare(passwordToTest, hash).then(res => {
    console.log(`Password matches hash ${hash}: ${res}`);
  });
});
