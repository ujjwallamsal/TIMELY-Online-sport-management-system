import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <pre className="text-sm bg-gray-50 border rounded p-3 overflow-auto">{String(error)}</pre>
        <button className="mt-4 border rounded px-3 py-2"
                onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}>
          Try again
        </button>
      </div>
    );
  }
}
