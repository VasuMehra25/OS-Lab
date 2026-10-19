import React from 'react';
import './ComputerIllustration.css';

export function ComputerIllustration() {
  return (
    <div className="computer-illustration-card" data-component="computer-illustration">
      <svg
        viewBox="0 0 540 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="computer-svg"
        aria-label="Computer architecture illustration showing CPU, RAM, and Storage in solid green and yellow theme"
      >
        {/* Background Soft Glow */}
        <rect width="540" height="320" rx="24" fill="#F4FAF6" />

        {/* Bus connection pathways */}
        <path
          d="M 140 160 L 270 160 M 270 160 L 400 160"
          stroke="#9EE8BE"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="8 8"
          className="system-bus-path"
        />
        <path
          d="M 270 160 L 270 230"
          stroke="#FFE066"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="8 8"
          className="system-bus-path"
        />

        {/* --- 1. CPU Component (Left) --- */}
        <g className="illustr-component illustr-cpu" transform="translate(60, 90)">
          {/* CPU Outer Chip */}
          <rect
            x="0"
            y="0"
            width="120"
            height="120"
            rx="20"
            fill="#DFF7EA"
            stroke="#9EE8BE"
            strokeWidth="3.5"
          />
          {/* Gold pins on edge */}
          <line x1="15" y1="-5" x2="15" y2="0" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <line x1="35" y1="-5" x2="35" y2="0" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <line x1="55" y1="-5" x2="55" y2="0" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <line x1="75" y1="-5" x2="75" y2="0" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <line x1="95" y1="-5" x2="95" y2="0" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

          {/* CPU Die / Core */}
          <rect
            x="24"
            y="24"
            width="72"
            height="72"
            rx="12"
            fill="#FFFFFF"
            stroke="#18A558"
            strokeWidth="3"
          />
          {/* Core circuits */}
          <rect x="36" y="36" width="20" height="20" rx="4" fill="#DFF7EA" />
          <rect x="64" y="36" width="20" height="20" rx="4" fill="#FFF8D6" />
          <rect x="36" y="64" width="20" height="20" rx="4" fill="#FFF8D6" />
          <rect x="64" y="64" width="20" height="20" rx="4" fill="#DFF7EA" />
          <text
            x="60"
            y="136"
            textAnchor="middle"
            fill="#0F2818"
            fontSize="13"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            CPU (Core)
          </text>
        </g>

        {/* --- 2. System Controller / Bus Hub (Center) --- */}
        <g className="illustr-component illustr-bus" transform="translate(240, 130)">
          <circle cx="30" cy="30" r="26" fill="#FFFFFF" stroke="#18A558" strokeWidth="3.5" />
          <circle cx="30" cy="30" r="14" fill="#DFF7EA" />
          <text
            x="30"
            y="35"
            textAnchor="middle"
            fill="#0F7D3E"
            fontSize="10"
            fontWeight="900"
            fontFamily="JetBrains Mono, monospace"
          >
            BUS
          </text>
        </g>

        {/* --- 3. RAM Memory Module (Right) --- */}
        <g className="illustr-component illustr-ram" transform="translate(360, 90)">
          <rect
            x="0"
            y="0"
            width="130"
            height="120"
            rx="18"
            fill="#FFF8D6"
            stroke="#FFE066"
            strokeWidth="3.5"
          />
          {/* RAM IC chips */}
          <rect x="18" y="22" width="22" height="40" rx="4" fill="#FFFFFF" stroke="#D4A017" strokeWidth="2.5" />
          <rect x="46" y="22" width="22" height="40" rx="4" fill="#FFFFFF" stroke="#D4A017" strokeWidth="2.5" />
          <rect x="74" y="22" width="22" height="40" rx="4" fill="#FFFFFF" stroke="#D4A017" strokeWidth="2.5" />
          {/* Gold contact notch */}
          <rect x="15" y="74" width="100" height="12" rx="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="65" cy="80" r="3" fill="#F59E0B" />
          <text
            x="65"
            y="136"
            textAnchor="middle"
            fill="#0F2818"
            fontSize="13"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            RAM (Memory)
          </text>
        </g>

        {/* --- 4. Storage Disk / Drive (Bottom Center) --- */}
        <g className="illustr-component illustr-storage" transform="translate(205, 205)">
          <rect
            x="0"
            y="0"
            width="130"
            height="85"
            rx="16"
            fill="#DFF7EA"
            stroke="#9EE8BE"
            strokeWidth="3.5"
          />
          {/* Disk platter graphic */}
          <circle cx="45" cy="42" r="24" fill="#FFFFFF" stroke="#18A558" strokeWidth="3" />
          <circle cx="45" cy="42" r="8" fill="#DFF7EA" stroke="#18A558" strokeWidth="2" />
          {/* Actuator arm */}
          <line x1="45" y1="42" x2="78" y2="28" stroke="#D4A017" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="78" cy="28" r="4.5" fill="#D4A017" />
          <text
            x="65"
            y="102"
            textAnchor="middle"
            fill="#0F2818"
            fontSize="13"
            fontWeight="900"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Secondary Storage
          </text>
        </g>

        {/* Data transfer animated packets */}
        <circle cx="205" cy="160" r="6" fill="#18A558" className="pulse-packet pulse-1" />
        <circle cx="335" cy="160" r="6" fill="#D4A017" className="pulse-packet pulse-2" />
        <circle cx="270" cy="195" r="6" fill="#18A558" className="pulse-packet pulse-3" />
      </svg>
    </div>
  );
}
