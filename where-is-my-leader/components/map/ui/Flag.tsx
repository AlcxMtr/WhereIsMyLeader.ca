/* eslint-disable @next/next/no-img-element */
import { flagUrl } from '../constants';

/** Country flag from flagcdn. Decorative, so it has no alt text. */
export default function Flag({
  code,
  width,
  height,
  className,
}: {
  code: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <img
      src={flagUrl(code, 40)}
      alt=""
      loading="lazy"
      width={width}
      height={height}
      className={className}
    />
  );
}
