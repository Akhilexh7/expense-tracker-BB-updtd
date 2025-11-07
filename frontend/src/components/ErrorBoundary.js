import React from 'react';
import { Alert, Button, Card } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-3">
          <Card.Body>
            <Alert variant="danger">
              <h4>Something went wrong</h4>
              <p>{this.state.error?.message || 'Unknown error'}</p>
              <Button 
                variant="primary" 
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </Button>
            </Alert>
          </Card.Body>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;