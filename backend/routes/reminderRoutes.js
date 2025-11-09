const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Reminder = require('../models/Reminder');

// Get all reminders for user
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching reminders for user:', req.user.userId);
    
    const reminders = await Reminder.find({ user: req.user.userId })
      .sort({ dueDate: 1, isCompleted: 1 });
    
    console.log('✅ Found reminders:', reminders.length);
    res.json(reminders);
  } catch (error) {
    console.error('❌ Get reminders error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new reminder
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('➕ Creating reminder:', req.body);
    
    const { title, dueDate, category } = req.body;

    // Validation
    if (!title || !dueDate) {
      return res.status(400).json({ message: "Title and due date are required" });
    }

    const reminder = new Reminder({
      user: req.user.userId,
      title: title.trim(),
      dueDate: new Date(dueDate),
      category: category || 'other'
    });

    await reminder.save();
    console.log('✅ Reminder created:', reminder._id);
    
    res.status(201).json(reminder);
  } catch (error) {
    console.error('❌ Create reminder error:', error);
    res.status(500).json({ message: "Server error creating reminder" });
  }
});

// Update reminder
router.put('/:id', verifyToken, async (req, res) => {
  try {
    console.log('✏️ Updating reminder:', req.params.id, req.body);
    
    const { title, dueDate, category, isCompleted } = req.body;

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!reminder) {
      console.log('❌ Reminder not found');
      return res.status(404).json({ message: "Reminder not found" });
    }

    // Update fields if provided
    if (title !== undefined) reminder.title = title.trim();
    if (dueDate !== undefined) reminder.dueDate = new Date(dueDate);
    if (category !== undefined) reminder.category = category;
    if (isCompleted !== undefined) reminder.isCompleted = isCompleted;

    await reminder.save();
    console.log('✅ Reminder updated');
    
    res.json(reminder);
  } catch (error) {
    console.error('❌ Update reminder error:', error);
    res.status(500).json({ message: "Server error updating reminder" });
  }
});

// Delete reminder
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Deleting reminder:', req.params.id);
    
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    await Reminder.findByIdAndDelete(req.params.id);
    console.log('✅ Reminder deleted');
    
    res.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error('❌ Delete reminder error:', error);
    res.status(500).json({ message: "Server error deleting reminder" });
  }
});

module.exports = router;