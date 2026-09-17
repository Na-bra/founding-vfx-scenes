import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, ...props };
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.2v12.7a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.8a5.9 5.9 0 1 0 5.1 5.9V9.2a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z" />
    </svg>
  );
}

export function DiscordIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5A20.3 20.3 0 0 0 .1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a13 13 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4a13 13 0 0 1-2 1l1.3 2a19.8 19.8 0 0 0 6-3 20.2 20.2 0 0 0-3.6-13.7ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.5-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.4-2.2 2.4Z" />
    </svg>
  );
}

export function FoundingMark(props: IconProps) {
  const { size = 28, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden {...rest}>
      <defs>
        <linearGradient id="fvx-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff3d2e" />
          <stop offset="0.55" stopColor="#ff6a3d" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#fvx-mark)" />
      <path d="M10 8.5h12.5v3.6h-8.4v3h7.3v3.5h-7.3v5.9H10z" fill="#160905" />
      <circle cx="22.3" cy="21.6" r="2.4" fill="#160905" />
    </svg>
  );
}
