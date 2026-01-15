/**
 * Microsoft Azure Icon Component
 * Uses Microsoft brand colors (#00A4EF)
 */

import React from "react";

interface AzureIconProps {
  className?: string;
}

export function AzureIcon({ className = "h-5 w-5" }: AzureIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Microsoft Azure"
    >
      <defs>
        <linearGradient
          id="azure-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: "#114A8B" }} />
          <stop offset="100%" style={{ stopColor: "#0669BC" }} />
        </linearGradient>
      </defs>
      <path
        d="M42.75 20L17.25 69H31.5L42.75 20Z"
        fill="url(#azure-gradient)"
      />
      <path
        d="M42.75 20L64.5 20L17.25 76H64.5L42.75 20Z"
        fill="url(#azure-gradient)"
        opacity="0.8"
      />
    </svg>
  );
}
