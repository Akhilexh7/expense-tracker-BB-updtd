import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { api } from '../utils/api';

const Budget = () => {
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetResponse, expensesResponse] = await Promise.all([
        api.get('/api/budget'),
        api.get('/api/expenses')
      ]);
      
      setBudget(budgetResponse.data);
      setExpenses(expensesResponse.data);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCategorySpending = () => {
    const spending = {};
    expenses.forEach(expense => {
      spending[expense.category] = (spending[expense.category] || 0) + expense.amount;
    });
    return spending;
  };

  const handleBudgetUpdate = async (categoryName, newAmount) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedCategories = budget.categories.map(cat =>
        cat.name === categoryName ? { ...cat, amount: parseFloat(newAmount) } : cat
      );

      const response = await api.post('/api/budget', {
        categories: updatedCategories
      });

      setBudget(response.data);
      setSuccess('Budget updated successfully!');
    } catch (error) {
      setError('Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const categorySpending = calculateCategorySpending();

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Budget Management</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Monthly Budget by Category</h5>
        </Card.Header>
        <Card.Body>
          {budget && (
            <Table responsive>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted Amount</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Progress</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {budget.categories.map(category => {
                  const spent = categorySpending[category.name] || 0;
                  const remaining = category.amount - spent;
                  const progress = (spent / category.amount) * 100;
                  
                  return (
                    <tr key={category.name}>
                      <td>
                        <span className="text-capitalize">{category.name}</span>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={category.amount}
                          onChange={(e) => handleBudgetUpdate(category.name, e.target.value)}
                          disabled={saving}
                          style={{ width: '120px' }}
                        />
                      </td>
                      <td>₹{spent.toFixed(2)}</td>
                      <td className={remaining < 0 ? 'text-danger' : 'text-success'}>
                        ₹{remaining.toFixed(2)}
                      </td>
                      <td>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className={`progress-bar ${
                              progress > 100 
                                ? 'bg-danger' 
                                : progress > 80 
                                ? 'bg-warning' 
                                : 'bg-success'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          >
                            {progress.toFixed(0)}%
                          </div>
                        </div>
                      </td>
                      <td>
                        {remaining < 0 && (
                          <span className="badge bg-danger">Over Budget</span>
                        )}
                        {progress > 80 && progress <= 100 && (
                          <span className="badge bg-warning">Almost There</span>
                        )}
                        {progress <= 80 && (
                          <span className="badge bg-success">On Track</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6>Budget Summary</h6>
            </Card.Header>
            <Card.Body>
              {budget && (
                <>
                  <p>
                    <strong>Total Budget:</strong> ₹
                    {budget.categories.reduce((sum, cat) => sum + cat.amount, 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Total Spent:</strong> ₹
                    {Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Remaining:</strong> ₹
                    {(
                      budget.categories.reduce((sum, cat) => sum + cat.amount, 0) -
                      Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)
                    ).toFixed(2)}
                  </p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6>Budget Tips</h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li>• Adjust your budget amounts as needed</li>
                <li>• Track your spending regularly</li>
                <li>• Red categories indicate over-budget spending</li>
                <li>• Yellow means you're close to your limit</li>
                <li>• Green means you're within budget</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Budget;