import React from "react";

const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
  outline: "border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-900 focus:ring-gray-400",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  as: Component = "button",
  ...props
}) {
  const classes = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
  return (
    <Component className={classes} aria-busy={isLoading || undefined} {...props}>
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </Component>
  );
}
