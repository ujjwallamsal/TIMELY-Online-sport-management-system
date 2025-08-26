export default function ErrorBanner({ message }) {
    if (!message) return null;
    return <div className="mb-4 text-red-600">Error: {message}</div>;
  }
  