import React, { useState, useEffect } from 'react';
import { Modal, Alert, ListGroup, Button, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { Bell, X, AlertTriangle, Clock, CheckCircle } from 'react-bootstrap-icons';
import { api } from '../utils/api';

const AlertSystem = () => {
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [autoShowModal, setAutoShowModal] = useState(false);

  useEffect(() => {
    fetchReminders();
    
    // Check for overdue reminders every minute
    const interval = setInterval(() => {
      checkUrgentReminders();
    }, 60000);
    
    // Check immediately on load
    checkUrgentReminders();
    
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/api/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    }
  };

  const checkUrgentReminders = () => {
    const now = new Date();
    const urgentReminders = reminders.filter(reminder => {
      if (reminder.isCompleted) return false;
      
      const dueDate = new Date(reminder.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Overdue or due within 24 hours
      return hoursDiff <= 24;
    });

    if (urgentReminders.length > 0) {
      setToastMessage(`🚨 You have ${urgentReminders.length} urgent reminder(s)!`);
      setShowToast(true);
      
      // Auto-show modal if there are overdue items
      const overdue = urgentReminders.filter(r => new Date(r.dueDate) < now);
      if (overdue.length > 0) {
        setAutoShowModal(true);
        setShowModal(true);
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`🚨 ${overdue.length} Overdue Reminder(s)`, {
            body: `You have ${overdue.length} overdue items that need attention!`,
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
      }
    }
  };

  const getUrgentReminders = () => {
    const now = new Date();
    return reminders.filter(reminder => {
      if (reminder.isCompleted) return false;
      
      const dueDate = new Date(reminder.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff <= 24;
    });
  };

  const getReminderStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 0) return { type: 'danger', text: 'OVERDUE', icon: <AlertTriangle /> };
    if (hoursDiff < 24) return { type: 'warning', text: 'URGENT', icon: <Clock /> };
    return { type: 'info', text: 'UPCOMING', icon: <Bell /> };
  };

  const toggleReminder = async (id, currentStatus) => {
    try {
      await api.put(`/api/reminders/${id}`, { isCompleted: !currentStatus });
      fetchReminders();
    } catch (error) {
      console.error('Failed to update reminder:', error);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const urgentReminders = getUrgentReminders();
  const hasUrgentReminders = urgentReminders.length > 0;

  return (
    <>
      {/* Floating Alert Button - Always visible when there are urgent reminders */}
      {hasUrgentReminders && (
        <div 
          className="position-fixed top-50 end-0 translate-middle-y"
          style={{ zIndex: 1060 }}
        >
          <Button
            variant="danger"
            size="lg"
            className="rounded-pill shadow-lg p-3"
            onClick={() => setShowModal(true)}
            style={{
              animation: 'pulse 2s infinite',
              border: '3px solid white'
            }}
          >
            <Bell size={24} className="me-2" />
            <Badge bg="light" text="dark" pill>
              {urgentReminders.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Urgent Reminders Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
        centered
      >
        <Modal.Header className={`bg-${hasUrgentReminders ? 'warning' : 'light'} text-dark`}>
          <Modal.Title>
            <AlertTriangle className="me-2" />
            {hasUrgentReminders ? '🚨 URGENT REMINDERS' : 'Reminders'}
            {hasUrgentReminders && (
              <Badge bg="danger" className="ms-2">
                {urgentReminders.length} URGENT
              </Badge>
            )}
          </Modal.Title>
          <Button 
            variant="outline-dark" 
            size="sm"
            onClick={() => setShowModal(false)}
          >
            <X size={20} />
          </Button>
        </Modal.Header>
        
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {urgentReminders.length > 0 ? (
            <>
              <Alert variant="warning" className="mb-3">
                <AlertTriangle className="me-2" />
                <strong>Action Required!</strong> You have {urgentReminders.length} reminder(s) that need your attention.
              </Alert>
              
              <ListGroup variant="flush">
                {urgentReminders.map((reminder, index) => {
                  const status = getReminderStatus(reminder.dueDate);
                  return (
                    <ListGroup.Item 
                      key={reminder._id}
                      className={`border-start-5 border-start-${status.type} mb-2`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <Badge bg={status.type} className="me-2">
                              {status.icon} {status.text}
                            </Badge>
                            <small className="text-muted">
                              Due: {new Date(reminder.dueDate).toLocaleString()}
                            </small>
                          </div>
                          <h6 className="mb-1">{reminder.title}</h6>
                          {reminder.category && (
                            <Badge bg="secondary" className="me-1">
                              {reminder.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => toggleReminder(reminder._id, reminder.isCompleted)}
                          title="Mark as completed"
                        >
                          <CheckCircle size={16} />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-success mb-3" />
              <h5>All caught up!</h5>
              <p className="text-muted">No urgent reminders at the moment.</p>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="primary" 
            onClick={() => setShowModal(false)}
            className="flex-fill"
          >
            {hasUrgentReminders ? 'I Understand - Will Handle Later' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1055 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)}
          delay={8000}
          autohide
          bg="warning"
        >
          <Toast.Header closeButton={false}>
            <Bell className="me-2" />
            <strong className="me-auto">Reminder Alert</strong>
            <Button 
              size="sm" 
              variant="outline-dark"
              onClick={() => setShowToast(false)}
            >
              <X size={14} />
            </Button>
          </Toast.Header>
          <Toast.Body>
            {toastMessage}
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline-dark"
                onClick={() => {
                  setShowModal(true);
                  setShowToast(false);
                }}
              >
                View Details
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Auto-show modal for overdue items */}
      {autoShowModal && hasUrgentReminders && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            zIndex: 1055,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
        >
          <Alert variant="danger" className="w-75 mx-auto shadow-lg">
            <Alert.Heading>
              <AlertTriangle className="me-2" />
              ⚠️ ATTENTION REQUIRED!
            </Alert.Heading>
            <p>
              You have <strong>{urgentReminders.length} urgent reminder(s)</strong> that need your immediate attention!
              Some items may be overdue.
            </p>
            <hr />
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-danger" 
                onClick={() => setAutoShowModal(false)}
              >
                Remind Me Later
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  setShowModal(true);
                  setAutoShowModal(false);
                }}
              >
                View Reminders Now
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
};

export default AlertSystem;