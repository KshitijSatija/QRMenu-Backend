const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {type: String, required: true, unique: true},
  password: { type: String, required: true },
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  mobileno: { type: Number, required: true, unique: true},
  dob: { type: Date, required: true },
  role: { type: String, default: "user" }, 
});


module.exports = mongoose.model("User", userSchema);
