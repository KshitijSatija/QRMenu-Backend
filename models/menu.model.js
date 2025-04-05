const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [itemSchema],
});

const menuSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurantName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  displayName: {  // New field
    type: String,
    trim: true,
    default: function() {
      return this.restaurantName; // Default to restaurantName if not set
    }
  },
  sections: [sectionSchema],
  todaysSpecial: itemSchema,
  qrCodeUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  displayMode: {
    type: String,
    enum: ['stacked', 'tabs'],
    default: 'stacked',
  },
  // New fields
  logo: {
    data: Buffer, // Store logo as binary data
    contentType: String, // MIME type
  },
  backgroundType: {
    type: String,
    enum: ['color', 'image'],
    default: 'color',
  },
  backgroundValue: { type: String, default: '#ffffff' }, // Color code
  backgroundImage: {
    data: Buffer, // Store background image as binary data
    contentType: String, // MIME type
  },
  socialLinks: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
    },
  ],
});

// Ensure restaurantName is linked to User's username
menuSchema.pre('validate', async function (next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    const user = await User.findById(this.restaurantId);
    if (user) this.restaurantName = user.username;
  }
  next();
});

module.exports = mongoose.model('Menu', menuSchema);