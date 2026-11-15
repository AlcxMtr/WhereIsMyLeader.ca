/**
 * A downward-pointing chevron. `rotation` turns it clockwise in degrees
 * (90 points left, 180 up, -90 right).
 */
export default function Chevron({
  size = 14,
  rotation = 0,
  className,
}: {
  size?: number;
  rotation?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      <path d="M2.2 4.2L6 8l3.8-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
