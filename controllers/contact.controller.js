const Contact = require('../models/contact.model');

const submitContactForm = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, company, message, country, agreed } = req.body;

        // Save to DB (optional)
        const contact = new Contact({
            firstName,
            lastName,
            email,
            phoneNumber,
            company,
            message,
            country,
            agreed
        });

        await contact.save();

        // You can also send an email here with nodemailer

        return res.status(201).json({ message: 'Contact form submitted successfully.' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
};

module.exports = {
    submitContactForm,
};
