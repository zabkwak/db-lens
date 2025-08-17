export const classNames = (...classes: (string | undefined | null)[]): string => {
	return classes.filter(Boolean).join(' ');
};
