const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to MongoDB and seed projects
connectDB().then(async () => {
  try {
    const Project = require('./models/Project');
    const User = require('./models/User');
    const count = await Project.countDocuments();
    if (count === 0) {
      let admin = await User.findOne({ email: 'admin@test.com' });
      if (!admin) {
        admin = await User.create({
          name: 'Admin',
          email: 'admin@test.com',
          password: 'password123',
          role: 'admin'
        });
      }
      
      await Project.insertMany([
        { name: 'talos', description: 'Talos development', status: 'active', owner: admin._id },
        { name: 'vindex', description: 'Vindex development', status: 'active', owner: admin._id },
        { name: 'skyscrapper', description: 'Skyscrapper development', status: 'active', owner: admin._id },
        { name: 'meta ai', description: 'Meta AI integration', status: 'active', owner: admin._id }
      ]);
      console.log('✅ Added default projects: talos, vindex, skyscrapper, meta ai');
    }
  } catch (err) {
    console.error('Error seeding projects:', err.message);
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// Serve static files (foolproof for deployment)
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
