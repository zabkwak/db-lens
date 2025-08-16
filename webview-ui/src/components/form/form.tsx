import { forwardRef, JSX, PropsWithChildren, useImperativeHandle, useReducer } from 'react';
import { TFormType } from '../../../../shared/configuration';
import FormContext, { IFormContextStateFormData } from './context';
import formReducer from './reducer';

export interface IFormData {
	[key: string]: TFormType | IFormData;
}

interface IProps {
	className?: string;
	onSubmit?: (data: IFormData) => Promise<void>;
}

interface IError {
	name: string;
	error: string;
}

export interface IFormRef {
	submit(): Promise<void>;
	clearProperty(name: string): void;
	isValid(): boolean;
	getData(): IFormData;
	setLoading(loading: boolean): void;
}

export default forwardRef(function Form(props: PropsWithChildren<IProps>, ref: React.Ref<IFormRef>): JSX.Element {
	const [state, dispatch] = useReducer(formReducer, {
		formData: {},
		errors: {},
		loading: false,
	});

	function validateData(data: IFormContextStateFormData, path: string = ''): IError[] {
		const errors: IError[] = [];
		for (const [key, value] of Object.entries(data)) {
			const name = path ? `${path}.${key}` : key;
			if ('required' in value && 'value' in value) {
				if (value.required && (value.value == null || value.value === '')) {
					errors.push({ name, error: 'This field is required' });
					continue;
				}
			} else {
				errors.push(...validateData(value as IFormContextStateFormData, name));
			}
		}
		return errors;
	}
	function isValid(): boolean {
		dispatch({
			type: 'VALIDATION_ERRORS',
			payload: [],
		});
		const errors = validateData(state.formData);
		if (errors.length) {
			dispatch({
				type: 'VALIDATION_ERRORS',
				payload: errors,
			});
			return false;
		}
		return true;
	}
	function constructData(data: IFormContextStateFormData): IFormData {
		return Object.entries(data).reduce((acc, [key, value]) => {
			if ('value' in value) {
				return {
					...acc,
					[key]: value.value as TFormType,
				};
			}
			return {
				...acc,
				[key]: constructData(value as IFormContextStateFormData),
			};
		}, {} as IFormData);
	}

	useImperativeHandle(ref, () => ({
		async submit(): Promise<void> {
			const { formData } = state;
			if (!isValid()) {
				return;
			}
			const data = constructData(formData);
			if (props.onSubmit) {
				await props.onSubmit(data);
			}
		},
		clearProperty(name: string): void {
			dispatch({
				type: 'CLEAR_PROPERTY',
				payload: { name },
			});
		},
		isValid(): boolean {
			return isValid();
		},
		getData(): IFormData {
			return constructData(state.formData);
		},
		setLoading(loading: boolean): void {
			dispatch({
				type: 'SET_LOADING',
				payload: { loading },
			});
		},
	}));

	return <FormContext.Provider value={{ state, dispatch }}>{props.children}</FormContext.Provider>;
});
