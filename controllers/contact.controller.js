const Contact = require('../models/contact.model');

const { sendContactFormConfirmation } = require('../utils/emailService');

const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, company, message, country, agreed } = req.body;
    

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

    // Send confirmation email
    await sendContactFormConfirmation(email, firstName, company);
    
    return res.status(201).json({ message: 'Contact form submitted successfully.' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};


module.exports = {
    submitContactForm,
};
