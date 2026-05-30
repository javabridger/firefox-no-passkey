// np-icons.jsx — simple geometric icon set for NoPasskey.
// NPIcon: a small library of passkey-blocking marks, stroke-based on currentColor.
// Each draws inside a 24×24 viewBox. `solid` fills the shield body.

function NPIcon({ name = 'shield-slash', size = 22, stroke = 1.8, solid = false }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  switch (name) {
    // 1 — Shield with a keyhole, struck through. The recommended mark.
    case 'shield-key':
      return (
        <svg {...common}>
          <path d="M12 2.5l7 2.6v5.4c0 4.6-3 7.8-7 9.1-4-1.3-7-4.5-7-9.1V5.1l7-2.6z" />
          <circle cx="12" cy="10.2" r="1.9" />
          <path d="M12 12.1v3.1" />
        </svg>
      );

    // 2 — Shield, optionally solid, struck through with a diagonal slash.
    case 'shield-slash':
      return (
        <svg {...common} fill={solid ? 'currentColor' : 'none'}>
          <path d="M12 2.5l7 2.6v5.4c0 4.6-3 7.8-7 9.1-4-1.3-7-4.5-7-9.1V5.1l7-2.6z" />
          <path d="M7.2 6.8l9.6 10" />
        </svg>
      );

    // 3 — Key with a prohibition slash.
    case 'key-slash':
      return (
        <svg {...common}>
          <circle cx="8.5" cy="14.5" r="3.4" />
          <path d="M10.9 12.1l6.4-6.4M14.4 8.6l2 2M12.6 10.4l1.6 1.6" />
          <path d="M4 20L20 4" />
        </svg>
      );

    // 4 — Padlock, struck through.
    case 'lock-slash':
      return (
        <svg {...common}>
          <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
          <path d="M8.2 10.5V7.8a3.8 3.8 0 017.6 0v2.7" />
          <path d="M4.5 4.5l15 15" />
        </svg>
      );

    // 5 — Fingerprint with a slash (biometric/passkey, blocked).
    case 'print-slash':
      return (
        <svg {...common}>
          <path d="M7 9.2a6 6 0 0110-1.4" />
          <path d="M9.2 11a3.2 3.2 0 015.6 1.4" />
          <path d="M12 12.4v3.1M8.3 14.6c.2 1.1.2 2.2 0 3.3M15.7 13.8c.4 1.6.3 3.2-.2 4.7" />
          <path d="M4.5 4.5l15 15" />
        </svg>
      );

    default:
      return null;
  }
}

window.NPIcon = NPIcon;
