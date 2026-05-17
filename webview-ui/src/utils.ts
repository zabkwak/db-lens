export function classNames(...classes: (string | undefined | null)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function pluralize(count: number, noun: string): string {
	return `${count} ${noun}${count !== 1 ? 's' : ''}`;
}

export function durationToString(duration: number): string {
	if (duration < 1000) {
		return `${duration}ms`;
	}
	const seconds = duration / 1000;
	if (seconds < 60) {
		return `${seconds.toFixed(4)}s`;
	}
	const minutes = seconds / 60;
	if (minutes < 60) {
		return getMinutes(duration);
	}
	return getHours(duration);
}

export function getMinutes(duration: number): string {
	const minutes = Math.floor(duration / 60000);
	const seconds = ((duration % 60000) / 1000).toFixed(0);
	return `${minutes}m ${seconds.padStart(2, '0')}s`;
}

export function getHours(duration: number): string {
	const hours = Math.floor(duration / 3600000);
	const minutes = Math.floor((duration % 3600000) / 60000);
	const seconds = ((duration % 60000) / 1000).toFixed(0);
	return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.padStart(2, '0')}s`;
}
