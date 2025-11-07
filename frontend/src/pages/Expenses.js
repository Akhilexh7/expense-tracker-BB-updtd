import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Card, Alert, Modal, Badge } from 'react-bootstrap';
import { Trash, Plus, ArrowUp, ArrowDown, CashCoin } from 'react-bootstrap-icons';
import VoiceExpenseInput from '../components/VoiceExpenseInput';
import { api } from '../utils/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses');
      setExpenses(response.data);
    } catch (error) {
      setError('Failed to fetch transactions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/api/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setSuccess(`${formData.type === 'income' ? 'Income' : 'Expense'} added successfully!`);
      setFormData({
        amount: '',
        description: '',
        category: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      fetchExpenses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/api/expenses/${id}`);
        setExpenses(expenses.filter(expense => expense._id !== id));
        setSuccess('Transaction deleted successfully!');
      } catch (error) {
        setError('Failed to delete transaction');
      }
    }
  };

  // Updated voice result handler with auto-type detection
  const handleVoiceResult = (transcript, detectedType = 'expense') => {
    const amountMatch = transcript.match(/\d+(\.\d{1,2})?/);
    
    if (amountMatch) {
      setFormData(prev => ({
        ...prev,
        amount: amountMatch[0],
        description: transcript,
        type: detectedType // Use the auto-detected type
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        description: transcript,
        type: detectedType // Use the auto-detected type
      }));
    }
  };

  const incomeCategories = ['salary', 'freelance', 'business', 'investment', 'bonus', 'gift', 'other income'];
  const expenseCategories = ['food', 'groceries', 'transport', 'entertainment', 'utilities', 'shopping', 'healthcare', 'education', 'other'];

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  // Calculate totals
  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalExpenses = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Money Manager</h1>
        <div>
          <Button 
            variant="success" 
            className="me-2"
            onClick={() => {
              setFormData({
                amount: '',
                description: '',
                category: '',
                type: 'income',
                date: new Date().toISOString().split('T')[0]
              });
              setShowForm(true);
            }}
          >
            <ArrowUp className="me-2" /> Add Income
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setFormData({
                amount: '',
                description: '',
                category: '',
                type: 'expense',
                date: new Date().toISOString().split('T')[0]
              });
              setShowForm(true);
            }}
          >
            <ArrowDown className="me-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-success bg-opacity-10">
            <Card.Body>
              <Card.Title className="text-success">
                <ArrowUp className="me-2" /> Total Income
              </Card.Title>
              <Card.Text className="h3 text-success fw-bold">
                ₹{totalIncome.toLocaleString('en-IN')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-danger bg-opacity-10">
            <Card.Body>
              <Card.Title className="text-danger">
                <ArrowDown className="me-2" /> Total Expenses
              </Card.Title>
              <Card.Text className="h3 text-danger fw-bold">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`text-center border-0 shadow-sm ${balance >= 0 ? 'bg-primary bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
            <Card.Body>
              <Card.Title className={balance >= 0 ? 'text-primary' : 'text-warning'}>
                <CashCoin className="me-2" /> Net Balance
              </Card.Title>
              <Card.Text className={`h3 fw-bold ${balance >= 0 ? 'text-primary' : 'text-warning'}`}>
                ₹{balance.toLocaleString('en-IN')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-info bg-opacity-10">
            <Card.Body>
              <Card.Title className="text-info">
                Savings Rate
              </Card.Title>
              <Card.Text className="h3 text-info fw-bold">
                {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">All Transactions</h5>
        </Card.Header>
        <Card.Body>
          {expenses.length === 0 ? (
            <div className="text-center py-5">
              <CashCoin size={48} className="text-muted mb-3" />
              <p className="text-muted">No transactions yet. Add your first income or expense!</p>
              <Button 
                variant="primary" 
                onClick={() => setShowForm(true)}
                className="mt-2"
              >
                <Plus className="me-2" /> Add Your First Transaction
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                    <td>{expense.description}</td>
                    <td>
                      <span className={`badge text-capitalize ${
                        expense.type === 'income' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {expense.category}
                      </span>
                    </td>
                    <td>
                      <Badge bg={expense.type === 'income' ? 'success' : 'danger'} className="text-capitalize">
                        {expense.type === 'income' ? <ArrowUp className="me-1" /> : <ArrowDown className="me-1" />}
                        {expense.type}
                      </Badge>
                    </td>
                    <td className={`fw-bold ${expense.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {expense.type === 'income' ? '+' : '-'}₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(expense._id)}
                        title="Delete transaction"
                      >
                        <Trash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {formData.type === 'income' ? 'Add Income' : 'Add Expense'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <VoiceExpenseInput onResult={handleVoiceResult} />
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Transaction Type</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="💰 Income"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="💸 Expense"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                placeholder={formData.type === 'income' ? "Salary, Freelance payment, etc." : "What did you spend on?"}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Auto-categorize</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant={formData.type === 'income' ? 'success' : 'primary'} 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Adding...' : `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Expenses;