import { VSCodeCheckbox, VSCodeDropdown, VSCodeOption, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { get } from 'lodash';
import { JSX, useCallback, useContext, useEffect, useId } from 'react';
import { IFormType, TFormType } from '../../../shared/configuration';
import { classNames } from '../utils';
import './form-control.scss';
import FormContext from './form/context';

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
	type: T;
	name?: string;
	className?: string;
	label?: string;
	labelPosition?: 'left' | 'top' | 'right' | 'bottom';
	required?: boolean;
	value?: IFormType[T];
	onChange?: (value: IFormType[T], name: string | null) => void;
	disabled?: boolean;
	defaultValue?: IFormType[T];
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
	const { state, dispatch } = useContext(FormContext);

	const dispatchValue = useCallback(
		(value: IFormType[T]) => {
			if (props.onChange) {
				props.onChange(value, props.name || null);
				return;
			}
			if (!props.name) {
				return;
			}
			dispatch({
				type: 'UPDATE_VALUE',
				payload: {
					name: props.name,
					// @ts-expect-error TODO figure out typings
					value,
					required: props.required ?? false,
				},
			});
		},
		[dispatch, props],
	);
	useEffect(() => {
		dispatchValue((props.defaultValue ?? props.value) as IFormType[T]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.defaultValue, props.value]);

	const getValue = <U extends TFormType>(): U | undefined => {
		if (!props.name) {
			return props.value as unknown as U;
		}
		return get(state.formData, props.name.split('.'))?.value ?? (props.value as unknown as U);
	};
	const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		dispatchValue(e.currentTarget.value as IFormType[T]);
	};
	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		dispatchValue(e.currentTarget.checked as IFormType[T]);
	};
	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(e.currentTarget.value);
		if (isNaN(value)) {
			return;
		}
		dispatchValue(value as IFormType[T]);
	};
	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatchValue(e.currentTarget.value as IFormType[T]);
	};

	const error = props.name ? state.errors[props.name] : undefined;

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
					value={getValue() ?? ''}
					// @ts-expect-error some weird typings
					onInput={handleTextFieldChange}
					required={props.required}
					disabled={state.loading || props.disabled}
				/>
			) : null}
			{isType(props, 'number') ? (
				<VSCodeTextField
					id={uniqueId}
					className="control text-field"
					name={props.name}
					placeholder={props.placeholder}
					value={(getValue() ?? '').toString()}
					// @ts-expect-error some weird typings
					onInput={handleNumberChange}
					required={props.required}
					disabled={state.loading || props.disabled}
				/>
			) : null}
			{isType(props, 'checkbox') ? (
				<VSCodeCheckbox
					id={uniqueId}
					className="control checkbox"
					checked={getValue() ?? false}
					// @ts-expect-error some weird typings
					onChange={handleCheckboxChange}
					required={props.required}
					disabled={state.loading || props.disabled}
				/>
			) : null}
			{isType(props, 'select') ? (
				<VSCodeDropdown
					id={uniqueId}
					className="form-control text-field"
					name={props.name}
					// @ts-expect-error some weird typings
					onChange={handleSelectChange}
					value={getValue()}
					disabled={state.loading || props.disabled}
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
