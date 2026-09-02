interface BasketballIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export function BasketballIcon({
  size = 24,
  strokeWidth = 2,
  className,
  ...rest
}: BasketballIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={!rest.role || rest.role === "presentation" ? "true" : undefined}
      {...rest}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M7 3.5c4 3 6 8.5 6 18.5" />
      <path d="M17 3.5c-4 3-6 8.5-6 18.5" />
      <path d="M3.5 12h17" />
      <path d="M3.5 7c4 1.5 13 1.5 17 0" />
      <path d="M3.5 17c4-1.5 13-1.5 17 0" />
    </svg>
  );
}

export { BasketballIcon as Basketball };
