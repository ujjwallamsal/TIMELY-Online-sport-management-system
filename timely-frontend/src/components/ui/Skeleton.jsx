import React from "react";

export default function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}


