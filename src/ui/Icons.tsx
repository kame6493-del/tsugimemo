/** 線の太さを揃えた自前のアイコン(見本のアイコン集の形に寄せた。絵文字は使わない) */
type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode, sw = 1.8) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const IconGear = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>, 1.6);

export const IconHistory = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
  <path d="M3 4.5v4h4" />
  <path d="M12 7.5V12l3 2" />
</>);

export const IconLock = ({ size = 22, className }: P) => svg(size, className, <>
  <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
  <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
</>);

export const IconBell = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
  <path d="M10 20.5a2 2 0 0 0 4 0" />
</>);

export const IconPhone = ({ size = 22, className }: P) => svg(size, className, <>
  <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
  <path d="M10.5 18.5h3" />
</>);

export const IconHome = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M4 10.5 12 4l8 6.5V20H4z" />
  <path d="M10 20v-5h4v5" />
</>);

export const IconMemo = ({ size = 22, className }: P) => svg(size, className, <>
  <rect x="5" y="3" width="14" height="18" rx="2.5" />
  <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
</>);

export const IconUp = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M12 19V6" /><path d="M6.5 11.5 12 6l5.5 5.5" /><path d="M5 20.5h14" />
</>);

export const IconUndo = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M4 5v5h5" />
  <path d="M4.5 10A8 8 0 1 1 6 17" />
</>, 2);

export const IconBan = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" />
</>);

export const IconList = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="5" cy="6.5" r="1.3" /><circle cx="5" cy="12" r="1.3" /><circle cx="5" cy="17.5" r="1.3" />
  <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
</>);

export const IconSun = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
</>);

export const IconPalette = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
  <circle cx="7.5" cy="11" r="1.1" fill="currentColor" /><circle cx="10" cy="7" r="1.1" fill="currentColor" /><circle cx="14.5" cy="7" r="1.1" fill="currentColor" />
</>);

export const IconClock = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
</>);

export const IconHandle = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M5 8h14M5 12h14M5 16h14" />
</>, 1.5);

export const IconChevronDown = ({ size = 16, className }: P) => svg(size, className, <path d="m7 10 5 5 5-5" />, 2);

export const IconChevronRight = ({ size = 18, className }: P) => svg(size, className, <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />, 2);

export const IconChevronLeft = ({ size = 22, className }: P) => svg(size, className, <path d="M14.5 6 8.5 12l6 6" />, 2.2);

export const IconArrowRight = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
</>, 2.4);

export const IconClose = ({ size = 20, className }: P) => svg(size, className, <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>, 2);

export const IconCheck = ({ size = 18, className }: P) => svg(size, className, <path d="m5.5 12.5 4 4 9-9.5" />, 2.6);

export const IconTrash = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M4.5 7h15" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 13h9l1-13" /><path d="M10.5 11v5.5M13.5 11v5.5" />
</>);

export const IconPencil = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M15.5 4.5l4 4L9 19H5v-4z" /><path d="M13.5 6.5l4 4" />
</>);

export const IconPlus = ({ size = 20, className }: P) => svg(size, className, <><path d="M12 5v14" /><path d="M5 12h14" /></>, 2);

export const IconInfo = ({ size = 18, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
  <path d="M12 11v5.5" stroke="#fff" strokeWidth="2.2" /><circle cx="12" cy="7.8" r="1.2" fill="#fff" stroke="none" />
</>);

export const IconAlert = ({ size = 18, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
  <path d="M12 7v6" stroke="#fff" strokeWidth="2.2" /><circle cx="12" cy="16.5" r="1.2" fill="#fff" stroke="none" />
</>);

export const IconOk = ({ size = 18, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
  <path d="m8 12.3 2.7 2.7L16.2 9.4" stroke="#fff" strokeWidth="2.2" />
</>);

export const IconStore = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M4 8h16l-1.2 12H5.2z" /><path d="M9 8a3 3 0 0 1 6 0" />
</>);

export const IconMail = ({ size = 22, className }: P) => svg(size, className, <>
  <rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" />
</>);

export const IconShield = ({ size = 22, className }: P) => svg(size, className, <>
  <path d="M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" />
</>);

export const IconReplay = ({ size = 22, className }: P) => svg(size, className, <>
  <circle cx="12" cy="12" r="8.5" /><path d="m10 8.5 5 3.5-5 3.5z" />
</>);

export const IconToTop = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M5 4.5h14" /><path d="M12 20V9" /><path d="M7.5 13.5 12 9l4.5 4.5" />
</>);

export const IconToBottom = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M5 19.5h14" /><path d="M12 4v11" /><path d="M7.5 10.5 12 15l4.5-4.5" />
</>);
