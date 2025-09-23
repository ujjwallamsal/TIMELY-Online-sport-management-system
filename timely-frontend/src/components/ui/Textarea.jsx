export default function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${className}`}
      rows={4}
      {...props}
    />
  );
}


