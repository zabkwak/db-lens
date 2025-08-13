import { JSX, PropsWithChildren } from 'react';
import { classNames } from '../utils';
import './alert.scss';

interface IProps {
	variant: 'info' | 'success' | 'warning' | 'error';
}

export default function Alert({ children, variant }: PropsWithChildren<IProps>): JSX.Element {
	return (
		<span className={classNames('alert', `alert-${variant}`)} role="alert">
			{children}
		</span>
	);
}
