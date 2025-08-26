export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="text-center py-16">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
      <p className="text-slate-300 text-lg">{message}</p>
    </div>
  );
}
