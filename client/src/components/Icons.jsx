/**
 * Thin-stroke line icons (24x24 viewBox, 1.5px stroke) used across the app.
 * Inherit color via currentColor so CSS controls them.
 */
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconMenu = (props) => (
  <svg {...base} {...props}>
    <path d="M4 6.5h16M4 12h16M4 17.5h16" />
  </svg>
);

export const IconClose = (props) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconDashboard = (props) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconQuill = (props) => (
  <svg {...base} {...props}>
    <path d="M20 4c-6.5.5-11 3-13.5 7.5S4 20 4 20s4-.5 8.5-2.5S19.5 10.5 20 4Z" />
    <path d="M4 20 14 10" />
  </svg>
);

export const IconStudents = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M15.5 5.4a3.25 3.25 0 1 1 1.2 6.3" />
    <path d="M17.5 14.6c1.7.5 2.7 1.9 3 4" />
  </svg>
);

export const IconClock = ({ label, ...props }) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconBell = (props) => (
  <svg {...base} {...props}>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </svg>
);

export const IconShield = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 5 6v5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6l-7-2.5Z" />
    <path d="m9.5 12 1.8 1.8 3.2-3.6" />
  </svg>
);

export const IconLogout = (props) => (
  <svg {...base} {...props}>
    <path d="M14 4h-8a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h8" />
    <path d="M10 12h9.5M16.5 8.5 20 12l-3.5 3.5" />
  </svg>
);

export const IconSearch = (props) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconWhatsApp = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.6-1.9-1-.9.8a4.2 4.2 0 0 1-1.9-1.9l.8-.9-1-1.9L9 9.5Z" />
  </svg>
);

export const IconSms = (props) => (
  <svg {...base} {...props}>
    <path d="M4 5h16v11H8l-4 3V5Z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
  </svg>
);

export const IconMail = (props) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
    <path d="m4.5 7 7.5 5.5L19.5 7" />
  </svg>
);

export const IconExcel = (props) => (
  <svg {...base} {...props}>
    <path d="M13 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V9L13 3.5Z" />
    <path d="M13 3.5V9h5.5" />
    <path d="m9.5 12 4 5M13.5 12l-4 5" />
  </svg>
);

export const IconCrown = (props) => (
  <svg {...base} {...props}>
    <path d="m4 17 -1-9 5 4 4-7 4 7 5-4-1 9H4Z" />
    <path d="M4.5 20h15" />
  </svg>
);

export const IconGem = (props) => (
  <svg {...base} {...props}>
    <path d="M7 4h10l4 5-9 11L3 9l4-5Z" />
    <path d="M3 9h18M9.5 9 12 20 14.5 9M7 4l2.5 5L12 4l2.5 5L17 4" />
  </svg>
);
