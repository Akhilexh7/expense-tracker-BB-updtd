const Expense = require('../models/Expense');

// Enhanced categorization function
const categorizeTransaction = (description, type) => {
  if (type === 'income') return 'income';
  
  const categoryMap = {
    groceries: ['grocery', 'supermarket', 'bigbasket', 'vegetables', 'fruits', 'milk', 'bread'],
    transport: ['uber', 'ola', 'rapido', 'bus', 'train', 'taxi', 'auto', 'petrol', 'diesel'],
    food: ['restaurant', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'tea', 'zomato', 'swiggy'],
    entertainment: ['movie', 'netflix', 'prime', 'hotstar', 'concert', 'game', 'outing'],
    shopping: ['clothes', 'shoes', 'amazon', 'flipkart', 'myntra', 'ajio', 'shopping'],
    utilities: ['electricity', 'water', 'internet', 'wifi', 'mobile', 'recharge', 'bill'],
    healthcare: ['hospital', 'doctor', 'medicine', 'medical', 'pharmacy'],
    education: ['books', 'course', 'tuition', 'school', 'college'],
  };

  const text = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(word => text.includes(word))) {
      return category;
    }
  }
  return 'other';
};

// Add new expense/income
exports.addExpense = async (req, res) => {
  try {
    console.log('📥 Received expense data:', req.body);
    console.log('👤 User ID:', req.user.userId);
    
    const { amount, description, category, type, date } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        message: "Valid amount is required" 
      });
    }
    
    if (!description || description.trim() === '') {
      return res.status(400).json({ 
        message: "Description is required" 
      });
    }

    // Auto-categorize if no category provided
    const finalCategory = category || categorizeTransaction(description, type || 'expense');
    
    const expense = new Expense({
      user: req.user.userId,
      amount: parseFloat(amount),
      description: description.trim(),
      category: finalCategory,
      type: type || 'expense',
      date: date || new Date()
    });

    await expense.save();
    console.log('✅ Expense saved successfully:', expense._id);
    res.status(201).json(expense);
  } catch (error) {
    console.error('❌ Expense creation error:', error);
    res.status(500).json({ 
      message: "Server error: " + error.message 
    });
  }
};

// Get all expenses for user
exports.getExpenses = async (req, res) => {
  try {
    console.log('📥 Getting expenses for user:', req.user.userId);
    const expenses = await Expense.find({ user: req.user.userId }).sort({ date: -1 });
    console.log('✅ Found expenses:', expenses.length);
    res.json(expenses);
  } catch (error) {
    console.error('❌ Get expenses error:', error);
    res.status(500).json({ 
      message: "Server error: " + error.message 
    });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    console.log('🗑️ Deleting expense:', req.params.id, 'for user:', req.user.userId);
    
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      user: req.user.userId 
    });
    
    if (!expense) {
      return res.status(404).json({ 
        message: "Expense not found or you don't have permission to delete it" 
      });
    }

    await Expense.findByIdAndDelete(req.params.id);
    console.log('✅ Expense deleted successfully');
    res.json({ 
      message: "Expense deleted successfully" 
    });
  } catch (error) {
    console.error('❌ Delete expense error:', error);
    res.status(500).json({ 
      message: "Server error: " + error.message 
    });
  }
};