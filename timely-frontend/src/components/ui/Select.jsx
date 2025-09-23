export default function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}


