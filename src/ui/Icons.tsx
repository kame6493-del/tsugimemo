/** 線の太さを揃えた自前のアイコン(絵文字は使わない) */
type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode, sw = 1.8) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const IconNow = ({ size = 24, className }: P) => svg(size, className, <>
  <circle cx="5.5" cy="6" r="2.2" />
  <path d="M10.5 6H20" />
  <path d="M4 12.5h16" />
  <path d="M4 18h11" />
</>);

export const IconLock = ({ size = 24, className }: P) => svg(size, className, <>
  <rect x="5.5" y="2.5" width="13" height="19" rx="3" />
  <path d="M9 7.5h6" />
  <path d="M8.5 11.5h7" />
  <path d="M8.5 14.5h4.5" />
</>);

export const IconSettings = ({ size = 24, className }: P) => svg(size, className, <>
  <path d="M4 7h9" /><path d="M17 7h3" /><circle cx="15" cy="7" r="2" />
  <path d="M4 17h3" /><path d="M11 17h9" /><circle cx="9" cy="17" r="2" />
</>);

export const IconUp = ({ size = 24, className }: P) => svg(size, className, <>
  <path d="M12 19V6" /><path d="M6.5 11.5 12 6l5.5 5.5" />
</>, 2.2);

export const IconToTop = ({ size = 24, className }: P) => svg(size, className, <>
  <path d="M5 4.5h14" /><path d="M12 20V9" /><path d="M7.5 13.5 12 9l4.5 4.5" />
</>);

export const IconToBottom = ({ size = 24, className }: P) => svg(size, className, <>
  <path d="M5 19.5h14" /><path d="M12 4v11" /><path d="M7.5 10.5 12 15l4.5-4.5" />
</>);

export const IconChevron = ({ size = 16, className }: P) => svg(size, className, <path d="m7 10 5 5 5-5" />, 2);

export const IconChevronRight = ({ size = 16, className }: P) => svg(size, className, <path d="m10 7 5 5-5 5" />, 2);

export const IconClose = ({ size = 22, className }: P) => svg(size, className, <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>);

export const IconCheck = ({ size = 18, className }: P) => svg(size, className, <path d="m5.5 12.5 4 4 9-9.5" />, 2.4);

export const IconTrash = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M4.5 7h15" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" />
</>);

export const IconPlus = ({ size = 20, className }: P) => svg(size, className, <><path d="M12 5v14" /><path d="M5 12h14" /></>, 2);

export const IconPin = ({ size = 20, className }: P) => svg(size, className, <>
  <path d="M5 5h14" /><path d="M12 9v11" /><path d="M8.5 12.5 12 9l3.5 3.5" />
</>, 2);
