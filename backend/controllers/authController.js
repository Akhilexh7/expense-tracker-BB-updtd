const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// User registration
exports.signup = async (req, res) => {
  try {
    console.log('📝 Signup request received:', req.body);
    
    const { username, email, password } = req.body;
    
    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required: username, email, password" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "User already exists with this email or username" 
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();
    console.log('✅ User created successfully:', user._id);
    
    res.status(201).json({ 
      message: "User created successfully" 
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      message: "Server error during signup" 
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    console.log('🔐 Login attempt for email:', req.body.email);
    
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check password
    console.log('🔑 Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.email);
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ JWT token generated successfully');

    console.log('✅ Login successful for user:', user.email);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: "Server error during login" 
    });
  }
};