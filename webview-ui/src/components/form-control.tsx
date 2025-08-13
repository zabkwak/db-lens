import { VSCodeCheckbox, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { JSX, useId, useState } from 'react';
import { IFormType } from '../../../shared/configuration';
import { classNames } from '../utils';
import './form-control.scss';

interface ISelectOption {
	label: string;
	value: string;
}

interface ITypeProps {
	text: {
		placeholder?: string;
	};
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	checkbox: {};
	number: {
		placeholder?: string;
	};
	select: {
		options: ISelectOption[];
	};
}

interface IProps<T extends keyof IFormType> {
	className?: string;
	label?: string;
	labelPosition?: 'left' | 'top' | 'right' | 'bottom';
	required?: boolean;
	type: T;
	value?: IFormType[T];
	onChange?: (value: IFormType[T], name: string | null) => void;
	name?: string;
	disabled?: boolean;
}

export type TType = keyof IFormType;

function isType<K extends keyof IFormType>(
	props: { type: keyof IFormType },
	type: K,
): props is IProps<K> & ITypeProps[K] {
	return props.type === type;
}

const FormControl = <T extends keyof IFormType>(props: IProps<T> & ITypeProps[T]): JSX.Element => {
	const uniqueId = useId();
	const [error] = useState<string | undefined>(undefined);

	const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (props.onChange) {
			props.onChange(e.currentTarget.value as IFormType[T], props.name || null);
		}
	};
	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (props.onChange) {
			props.onChange(e.currentTarget.checked as IFormType[T], props.name || null);
		}
	};
	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(e.currentTarget.value);
		if (isNaN(value)) {
			return;
		}
		if (props.onChange) {
			props.onChange(value as IFormType[T], props.name || null);
		}
	};
	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (props.onChange) {
			props.onChange(e.currentTarget.value as IFormType[T], props.name || null);
		}
	};

	return (
		<div className={classNames('form-control', `${props.labelPosition || 'top'}-label`, props.className)}>
			{props.label ? (
				<label className="label" htmlFor={uniqueId}>
					{props.label}
					{props.required ? <span className="required">*</span> : null}
				</label>
			) : null}
			{isType(props, 'text') ? (
				<VSCodeTextField
					id={uniqueId}
					className="control text-field"
					name={props.name}
					placeholder={props.placeholder}
					value={props.value ?? ''}
					// @ts-expect-error some weird typings
					onInput={handleTextFieldChange}
					required={props.required}
					disabled={props.disabled}
				/>
			) : null}
			{isType(props, 'number') ? (
				<VSCodeTextField
					id={uniqueId}
					className="control text-field"
					name={props.name}
					placeholder={props.placeholder}
					value={(props.value ?? '').toString()}
					// @ts-expect-error some weird typings
					onInput={handleNumberChange}
					required={props.required}
					disabled={props.disabled}
				/>
			) : null}
			{isType(props, 'checkbox') ? (
				<VSCodeCheckbox
					id={uniqueId}
					className="control checkbox"
					checked={props.value ?? false}
					// @ts-expect-error some weird typings
					onChange={handleCheckboxChange}
					required={props.required}
					disabled={props.disabled}
				/>
			) : null}
			{isType(props, 'select') ? (
				<VSCodeDropdown
					id={uniqueId}
					className="form-control text-field"
					name={props.name}
					// @ts-expect-error some weird typings
					onChange={handleSelectChange}
					value={props.value}
					disabled={props.disabled}
				>
					{props.options.map(({ label, value }) => (
						<VSCodeOption key={value} value={value}>
							{label}
						</VSCodeOption>
					))}
				</VSCodeDropdown>
			) : null}
			{error ? <span className="error">{error}</span> : null}
		</div>
	);
};

export default FormControl;
