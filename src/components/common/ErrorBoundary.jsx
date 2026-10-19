import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OS Inside Runtime Error Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: '#181E38',
          backgroundColor: '#FAF9FE'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '36px',
            boxShadow: '0 8px 30px rgba(30, 36, 66, 0.08)',
            border: '1px solid #ECEBF5',
            textAlign: 'center'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#FDF0F5',
              border: '1px solid #F9CADB',
              color: '#DB5483',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
              Something interrupted the view
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#6B769D', lineHeight: 1.5, marginBottom: '24px' }}>
              An unexpected error occurred while rendering this component.
            </p>

            {this.state.error && (
              <div style={{
                background: '#F4F3FB',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                color: '#DB5483',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#7D61E2',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FFFFFF',
                  color: '#3B4468',
                  border: '1px solid #DDDCEB',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
