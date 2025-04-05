const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    company: String,
    message: String,
    country: String,
    agreed: Boolean
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
