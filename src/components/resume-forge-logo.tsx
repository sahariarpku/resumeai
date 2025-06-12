import type { SVGProps } from 'react';

export function ResumeForgeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="ResumeForge Logo"
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M10 40 C10 10, 20 10, 20 40 Z M25 15 L35 15 L30 40 Z" fill="url(#grad1)" />
      <text
        x="45"
        y="35"
        fontFamily="Space Grotesk, sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="font-headline"
      >
        ResumeForge
      </text>
    </svg>
  );
}
