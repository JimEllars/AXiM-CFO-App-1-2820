import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 m-2 bg-[rgba(255,141,131,0.1)] border border-[rgba(255,141,131,0.2)] rounded-lg text-[#ff8d83] shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <p className="text-sm">We are unable to display this component at the moment.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
