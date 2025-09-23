export default function Checkbox({ className = '', label, ...props }) {
  return (
    <label className={`inline-flex items-center space-x-2 text-sm ${className}`}>
      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" {...props} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}


