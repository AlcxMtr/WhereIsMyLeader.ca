/** Joins the truthy class names: `cx('a', isOn && 'b')`. */
export const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(' ');
