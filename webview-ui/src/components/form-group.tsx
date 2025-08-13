import { JSX, PropsWithChildren, useState } from 'react';
import { classNames } from '../utils';
import FormControl from './form-control';
import './form-group.scss';

interface IProps {
	className?: string;
	label?: string;
	visible?: boolean;
	hidable?: boolean;
	disabled?: boolean;
}

const FormGroup = ({
	className,
	label,
	visible = false,
	hidable = true,
	disabled = false,
	children,
}: PropsWithChildren<IProps>): JSX.Element => {
	const [isVisible, setVisible] = useState(!hidable ? true : visible || false);
	return (
		<div className={classNames('form-group', className)}>
			{label ? (
				<FormControl
					label={label}
					type="checkbox"
					onChange={setVisible}
					value={isVisible}
					labelPosition="right"
					disabled={disabled}
				/>
			) : null}
			{isVisible ? <div className="children">{children}</div> : null}
		</div>
	);
};

export default FormGroup;
