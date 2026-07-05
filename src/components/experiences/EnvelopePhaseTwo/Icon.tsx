import React from 'react';

const paths: Record<string, React.ReactNode> = {
  'arrow-down': <><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></>,
  'check': <path d="M5 12l5 5L20 6" />,
  'eye-off': <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9 9 0 0 1 21 12a15 15 0 0 1-2 2.7M6.3 6.3A9 9 0 0 0 3 12a9 9 0 0 0 11.6 5.2" /></>,
  'eye': <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  'play': <path d="M7 5v14l11-7z" />,
  'pause': <><path d="M8 5v14" /><path d="M16 5v14" /></>,
  'clock': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  'lock': <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  'narrow': <><path d="M20 4l-6 6M14 4h6v6M4 20l6-6M10 20H4v-6" /></>,
  'info': <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5v.01" /></>,
};

export function Icon({ name, size = 16, ...rest }: { name: keyof typeof paths | string; size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}>
      {paths[name] ?? null}
    </svg>
  );
}
