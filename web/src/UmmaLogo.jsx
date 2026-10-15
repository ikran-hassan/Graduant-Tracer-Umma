import React from 'react';

export default function UmmaLogo({ size = 42, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Outer Glow & Base Shield Circle */}
      <circle cx="60" cy="60" r="58" fill="#101b3d" />
      <circle cx="60" cy="60" r="54" stroke="#d5ad54" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="50" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1" />

      {/* Decorative Top Star / Emblem Rays */}
      <path
        d="M60 16L63 23L70 24L65 29L66 36L60 32L54 36L55 29L50 24L57 23Z"
        fill="#d5ad54"
      />

      {/* Open Book of Knowledge */}
      <g transform="translate(60, 52)">
        {/* Left Page */}
        <path
          d="M-2 -10 C-12 -16, -26 -16, -34 -11 V14 C-26 9, -12 9, -2 15 Z"
          fill="#ffffff"
          stroke="#d5ad54"
          strokeWidth="1.5"
        />
        {/* Right Page */}
        <path
          d="M2 -10 C12 -16, 26 -16, 34 -11 V14 C26 9, 12 9, 2 15 Z"
          fill="#ffffff"
          stroke="#d5ad54"
          strokeWidth="1.5"
        />
        {/* Book Spine */}
        <path d="M0 -10 V16" stroke="#101b3d" strokeWidth="2" strokeLinecap="round" />
        {/* Page Lines Left */}
        <line x1="-26" y1="-5" x2="-8" y2="-2" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
        <line x1="-28" y1="1" x2="-8" y2="4" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
        <line x1="-26" y1="7" x2="-8" y2="10" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
        {/* Page Lines Right */}
        <line x1="8" y1="-2" x2="26" y2="-5" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
        <line x1="8" y1="4" x2="28" y2="1" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
        <line x1="8" y1="10" x2="26" y2="7" stroke="#101b3d" strokeWidth="1.2" strokeOpacity="0.4" />
      </g>

      {/* Golden Crescent / Arch motif */}
      <path
        d="M26 80 C40 92, 80 92, 94 80 C80 86, 40 86, 26 80 Z"
        fill="#d5ad54"
      />

      {/* UMMA Banner */}
      <rect x="30" y="88" width="60" height="15" rx="4" fill="#d5ad54" />
      <text
        x="60"
        y="99"
        textAnchor="middle"
        fill="#101b3d"
        fontSize="10"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        UMMA
      </text>
    </svg>
  );
}
