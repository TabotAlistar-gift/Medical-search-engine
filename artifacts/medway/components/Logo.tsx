import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-cross-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0066cc" />
          <stop offset="100%" stop-color="#00a896" />
        </linearGradient>
      </defs>

      {/* Outer swoosh arc */}
      <path
        d="M 145 42 A 74 74 0 1 0 110 178"
        stroke="url(#logo-cross-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rounded medical cross */}
      <path
        d="M 75 45 C 75 39 80 34 86 34 H 114 C 120 34 125 39 125 45 V 75 H 155 C 161 75 166 80 166 86 V 114 C 166 120 161 125 155 125 H 125 V 155 C 125 161 120 166 114 166 H 86 C 80 166 75 161 75 155 V 125 H 45 C 39 125 34 120 34 114 V 86 C 34 80 39 75 45 75 H 75 Z"
        fill="url(#logo-cross-grad)"
      />

      {/* Left ear tube */}
      <path
        d="M 91 62 C 91 74 96 84 100 84"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right ear tube */}
      <path
        d="M 109 62 C 109 74 104 84 100 84"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ear tips */}
      <circle cx="91" cy="62" r="4.5" fill="white" />
      <circle cx="109" cy="62" r="4.5" fill="white" />

      {/* Stethoscope tube swooping down, out, and to the right */}
      <path
        d="M 100 84 V 102 C 100 124 114 138 130 138 C 146 138 155 124 155 106"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stethoscope chestpiece */}
      <circle
        cx="155"
        cy="106"
        r="13"
        fill="#00a896"
        stroke="white"
        strokeWidth="3.5"
      />
      <circle cx="155" cy="106" r="3.5" fill="white" />
    </svg>
  );
}
