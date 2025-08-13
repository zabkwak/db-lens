import { isCommand as sharedIsCommand } from '../../shared/utils';

/** @deprecated */
export const isCommand = sharedIsCommand;

export const classNames = (...classes: (string | undefined | null)[]): string => {
	return classes.filter(Boolean).join(' ');
};
