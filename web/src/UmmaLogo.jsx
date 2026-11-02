import React from 'react';

export default function UmmaLogo({ size = 42, className = '' }) {
  return (
    <img
      src="/umma-logo.png"
      alt="Umma University"
      className={className}
      style={{
        width: size * (768 / 1058),
        height: size,
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain'
      }}
    />
  );
}
