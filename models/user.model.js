const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: {type: String, required: true, unique: true},
  password: { type: String, required: true },
  firstName: {type: String},
  lastName: {type: String},
  mobileno: { type: Number, unique: true},
  dob: { type: Date},
  role: { type: String, default: "user" }, 
  active: {type: Boolean, required: true, default: true},
});


module.exports = mongoose.model("User", userSchema);
