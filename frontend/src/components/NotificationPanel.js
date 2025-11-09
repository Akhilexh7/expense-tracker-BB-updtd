import React, { useState, useEffect } from 'react';
import { 
  NavDropdown, 
  Badge, 
  Button, 
  Modal, 
  Form,
  Alert,
  Spinner
} from 'react-bootstrap';
import { Bell, Plus, Check, Trash } from 'react-bootstrap-icons';
import { api } from '../utils/api';

const NotificationPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    category: ''
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setFetchLoading(true);
      console.log('🔄 Fetching reminders...');
      
      const response = await api.get('/api/reminders');
      console.log('✅ Reminders fetched:', response.data);
      
      setReminders(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch reminders:', error);
      setError('Failed to load reminders');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📤 Adding reminder:', formData);
      
      const response = await api.post('/api/reminders', formData);
      console.log('✅ Reminder added:', response.data);
      
      setSuccess('Reminder added successfully!');
      setFormData({ title: '', dueDate: '', category: '' });
      setShowModal(false);
      
      // Refresh the reminders list
      await fetchReminders();
    } catch (error) {
      console.error('❌ Failed to add reminder:', error);
      setError(error.response?.data?.message || 'Failed to add reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id, currentStatus) => {
    try {
      console.log('🔄 Toggling reminder:', id, !currentStatus);
      
      await api.put(`/api/reminders/${id}`, { 
        isCompleted: !currentStatus 
      });
      
      // Update local state immediately for better UX
      setReminders(prev => 
        prev.map(reminder => 
          reminder._id === id 
            ? { ...reminder, isCompleted: !currentStatus }
            : reminder
        )
      );
    } catch (error) {
      console.error('❌ Failed to update reminder:', error);
      alert('Failed to update reminder. Please try again.');
      // Revert on error
      await fetchReminders();
    }
  };

  const deleteReminder = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        console.log('🗑️ Deleting reminder:', id);
        
        await api.delete(`/api/reminders/${id}`);
        
        // Update local state immediately
        setReminders(prev => prev.filter(reminder => reminder._id !== id));
      } catch (error) {
        console.error('❌ Failed to delete reminder:', error);
        alert('Failed to delete reminder. Please try again.');
        // Revert on error
        await fetchReminders();
      }
    }
  };

  // Filter reminders by status
  const overdueReminders = reminders.filter(reminder => {
    const dueDate = new Date(reminder.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && !reminder.isCompleted;
  });

  const upcomingReminders = reminders.filter(reminder => {
    const dueDate = new Date(reminder.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek && !reminder.isCompleted;
  });

  const completedReminders = reminders.filter(reminder => reminder.isCompleted);

  const categories = ['utilities', 'rent', 'subscriptions', 'insurance', 'other'];

  // Set default due date to tomorrow
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <>
      <NavDropdown
        title={
          <div className="d-flex align-items-center">
            <Bell size={18} className="me-1" />
            {overdueReminders.length + upcomingReminders.length > 0 && (
              <Badge bg="danger" pill className="ms-1">
                {overdueReminders.length + upcomingReminders.length}
              </Badge>
            )}
          </div>
        }
        align="end"
        id="notification-dropdown"
      >
        <NavDropdown.Header>
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Reminders</span>
            <Button 
              size="sm" 
              variant="outline-primary"
              onClick={() => {
                setFormData({ 
                  title: '', 
                  dueDate: getTomorrowDate(), 
                  category: '' 
                });
                setShowModal(true);
              }}
            >
              <Plus size={14} />
            </Button>
          </div>
        </NavDropdown.Header>

        {fetchLoading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <>
            {/* Overdue Reminders */}
            {overdueReminders.length > 0 && (
              <>
                <NavDropdown.Divider />
                <NavDropdown.Header className="text-danger small">
                  ⚠️ Overdue ({overdueReminders.length})
                </NavDropdown.Header>
                {overdueReminders.slice(0, 3).map(reminder => (
                  <NavDropdown.Item 
                    key={reminder._id} 
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="d-flex justify-content-between align-items-start w-100">
                      <div className="flex-grow-1 me-2">
                        <div className="fw-semibold small text-danger">
                          {reminder.title}
                        </div>
                        <small className="text-danger">
                          Due: {new Date(reminder.dueDate).toLocaleDateString()}
                        </small>
                        {reminder.category && (
                          <Badge bg="secondary" className="ms-1" size="sm">
                            {reminder.category}
                          </Badge>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => toggleReminder(reminder._id, reminder.isCompleted)}
                          title="Mark complete"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteReminder(reminder._id)}
                          title="Delete reminder"
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    </div>
                  </NavDropdown.Item>
                ))}
              </>
            )}

            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
              <>
                <NavDropdown.Divider />
                <NavDropdown.Header className="text-warning small">
                  📅 Upcoming ({upcomingReminders.length})
                </NavDropdown.Header>
                {upcomingReminders.slice(0, 3).map(reminder => (
                  <NavDropdown.Item 
                    key={reminder._id} 
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="d-flex justify-content-between align-items-start w-100">
                      <div className="flex-grow-1 me-2">
                        <div className="fw-semibold small">
                          {reminder.title}
                        </div>
                        <small className="text-muted">
                          Due: {new Date(reminder.dueDate).toLocaleDateString()}
                        </small>
                        {reminder.category && (
                          <Badge bg="secondary" className="ms-1" size="sm">
                            {reminder.category}
                          </Badge>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => toggleReminder(reminder._id, reminder.isCompleted)}
                          title="Mark complete"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteReminder(reminder._id)}
                          title="Delete reminder"
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    </div>
                  </NavDropdown.Item>
                ))}
              </>
            )}

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <>
                <NavDropdown.Divider />
                <NavDropdown.Header className="text-success small">
                  ✅ Completed ({completedReminders.length})
                </NavDropdown.Header>
                {completedReminders.slice(0, 2).map(reminder => (
                  <NavDropdown.Item 
                    key={reminder._id} 
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="d-flex justify-content-between align-items-start w-100">
                      <div className="flex-grow-1 me-2">
                        <div className="small text-decoration-line-through text-muted">
                          {reminder.title}
                        </div>
                        <small className="text-muted">
                          Completed on {new Date(reminder.updatedAt || reminder.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => deleteReminder(reminder._id)}
                        title="Delete reminder"
                      >
                        <Trash size={12} />
                      </Button>
                    </div>
                  </NavDropdown.Item>
                ))}
              </>
            )}

            {/* Empty State */}
            {reminders.length === 0 && !fetchLoading && (
              <NavDropdown.ItemText className="text-center text-muted py-3">
                No reminders yet
                <br />
                <small>Click + to add your first reminder</small>
              </NavDropdown.ItemText>
            )}
          </>
        )}

        <NavDropdown.Divider />
        <NavDropdown.Item 
          onClick={() => {
            setFormData({ 
              title: '', 
              dueDate: getTomorrowDate(), 
              category: '' 
            });
            setShowModal(true);
          }}
          className="text-center"
        >
          <Plus className="me-1" />
          Add New Reminder
        </NavDropdown.Item>
      </NavDropdown>

      {/* Add Reminder Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Reminder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Electricity Bill, Rent Payment"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={100}
              />
              <Form.Text className="text-muted">
                What do you need to remember?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Form.Text className="text-muted">
                When is this due?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="flex-fill"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Adding...
                  </>
                ) : (
                  'Add Reminder'
                )}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NotificationPanel;