export function classNames(...classes: (string | undefined | null)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function pluralize(count: number, noun: string): string {
	return `${count} ${noun}${count !== 1 ? 's' : ''}`;
}
