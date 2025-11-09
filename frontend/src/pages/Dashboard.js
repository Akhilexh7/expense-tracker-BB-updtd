import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button, ButtonGroup } from 'react-bootstrap';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { api } from '../utils/api';
import ReminderManager from '../components/ReminderManager';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphType, setGraphType] = useState('line'); // line or scatter

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [expensesResponse, budgetResponse] = await Promise.all([
        api.get('/api/expenses'),
        api.get('/api/budget')
      ]);
      setExpenses(expensesResponse.data);
      setBudget(budgetResponse.data);
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalExpenses = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Prepare data for XY charts without date adapter
  const prepareDailyNetFlow = () => {
    const dailyTotals = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-IN');
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      
      if (expense.type === 'income') {
        dailyTotals[date] += expense.amount;
      } else {
        dailyTotals[date] -= expense.amount;
      }
    });

    // Convert to array and sort by date
    return Object.entries(dailyTotals)
      .map(([date, net]) => ({ date, net }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const prepareRunningBalance = () => {
    const dailyNetFlow = prepareDailyNetFlow();
    let runningBalance = 0;
    
    return dailyNetFlow.map(day => {
      runningBalance += day.net;
      return {
        date: day.date,
        balance: runningBalance
      };
    });
  };

  const prepareIncomeExpenseSeries = () => {
    const dailyData = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-IN');
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expense: 0, date };
      }
      
      if (expense.type === 'income') {
        dailyData[date].income += expense.amount;
      } else {
        dailyData[date].expense += expense.amount;
      }
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const prepareScatterData = () => {
    const scatterPoints = expenses.map(expense => ({
      x: new Date(expense.date).getTime(), // Use timestamp for X-axis
      y: expense.amount,
      type: expense.type,
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date).toLocaleDateString('en-IN')
    }));

    return scatterPoints.sort((a, b) => a.x - b.x);
  };

  // Chart data
  const runningBalanceData = prepareRunningBalance();
  const incomeExpenseSeries = prepareIncomeExpenseSeries();
  const scatterPoints = prepareScatterData();

  // Net Balance Line Chart
  const netBalanceChartData = {
    labels: runningBalanceData.map(item => item.date),
    datasets: [
      {
        label: 'Running Balance (₹)',
        data: runningBalanceData.map(item => item.balance),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#36A2EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  // Income vs Expenses Line Chart
  const incomeExpenseChartData = {
    labels: incomeExpenseSeries.map(item => item.date),
    datasets: [
      {
        label: 'Income (₹)',
        data: incomeExpenseSeries.map(item => item.income),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expenses (₹)',
        data: incomeExpenseSeries.map(item => item.expense),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Transaction Scatter Plot
  const scatterChartData = {
    datasets: [
      {
        label: 'Income',
        data: scatterPoints.filter(point => point.type === 'income'),
        backgroundColor: '#28a745',
        borderColor: '#218838',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointBorderColor: '#fff'
      },
      {
        label: 'Expenses',
        data: scatterPoints.filter(point => point.type === 'expense'),
        backgroundColor: '#dc3545',
        borderColor: '#c82333',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointBorderColor: '#fff'
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '₹' + context.parsed.y.toLocaleString('en-IN');
            }
            return label;
          }
        }
      }
    }
  };

  const scatterChartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Timeline'
        },
        ticks: {
          callback: function(value) {
            // Convert timestamp back to date for display
            return new Date(value).toLocaleDateString('en-IN');
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const point = context.raw;
            return [
              `Amount: ₹${point.y.toLocaleString('en-IN')}`,
              `Type: ${point.type}`,
              `Date: ${point.date}`,
              `Category: ${point.category}`
            ];
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Financial Dashboard</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm bg-success bg-opacity-10">
            <Card.Body>
              <Card.Title className="text-success">
                Total Income
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
                Total Expenses
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
                Net Balance
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
                Total Transactions
              </Card.Title>
              <Card.Text className="h3 text-info fw-bold">
                {expenses.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Chart Controls */}
      <Row className="mb-3">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Chart Type:</strong>
                </div>
                <ButtonGroup size="sm">
                  <Button
                    variant={graphType === 'line' ? 'primary' : 'outline-primary'}
                    onClick={() => setGraphType('line')}
                  >
                    Line Charts
                  </Button>
                  <Button
                    variant={graphType === 'scatter' ? 'primary' : 'outline-primary'}
                    onClick={() => setGraphType('scatter')}
                  >
                    Scatter Plot
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* XY Graphs Row */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                {graphType === 'line' ? 'Running Balance Over Time' : 'All Transactions Scatter Plot'}
              </h5>
            </Card.Header>
            <Card.Body>
              {graphType === 'line' ? (
                <Line 
                  data={netBalanceChartData} 
                  options={lineChartOptions}
                  height={300}
                />
              ) : (
                <Scatter 
                  data={scatterChartData} 
                  options={scatterChartOptions}
                  height={300}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Income vs Expenses Daily</h5>
            </Card.Header>
            <Card.Body>
              <Line 
                data={incomeExpenseChartData} 
                options={lineChartOptions}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions & Reminders */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Recent Transactions</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {expenses.length === 0 ? (
                <p className="text-muted text-center">No transactions yet</p>
              ) : (
                expenses.slice(0, 10).map((expense, index) => (
                  <div key={expense._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                      <small className="text-muted">
                        {new Date(expense.date).toLocaleDateString('en-IN')}
                      </small>
                      <div className="fw-semibold">
                        {expense.description}
                      </div>
                      <small className="text-capitalize text-muted">
                        {expense.category}
                      </small>
                    </div>
                    <div className={`fw-bold ${expense.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {expense.type === 'income' ? '+' : '-'}₹{expense.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <ReminderManager />
        </Col>
      </Row>

      {/* Financial Insights */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Financial Insights</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="text-center">
                  <div className="h4 text-success">
                    {expenses.filter(e => e.type === 'income').length}
                  </div>
                  <div className="text-muted">Income Entries</div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="h4 text-danger">
                    {expenses.filter(e => e.type === 'expense').length}
                  </div>
                  <div className="text-muted">Expense Entries</div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="h4 text-primary">
                    {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-muted">Savings Rate</div>
                </Col>
              </Row>
              {balance < 0 && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> You are currently overspending. Consider reducing expenses.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;