import { createContext } from 'react';
import { IFormType, TFormType } from '../../../../shared/configuration';

export interface IFormContextStateProperty {
	value: TFormType;
	required?: boolean;
}

export interface IFormContextStateFormData {
	[key: string]: IFormContextStateProperty | IFormContextStateFormData;
}

export interface IFormContextState {
	formData: IFormContextStateFormData;
	errors: Record<string, string>;
	loading: boolean;
}

export interface IFormActionPayload {
	UPDATE_VALUE: {
		name: string;
		value: keyof IFormType;
		required: boolean;
	};
	CLEAR_PROPERTY: {
		name: string;
	};
	VALIDATION_ERRORS: {
		name: string;
		error: string;
	}[];
	SET_LOADING: {
		loading: boolean;
	};
}

export interface IFormAction<T extends keyof IFormActionPayload> {
	type: T;
	payload: IFormActionPayload[T];
}

export interface IFormContext<T extends keyof IFormActionPayload> {
	state: IFormContextState;
	dispatch: React.Dispatch<IFormAction<T>>;
}

const FormContext = createContext<IFormContext<keyof IFormActionPayload>>({
	state: {
		formData: {},
		errors: {},
		loading: false,
	},
	dispatch: () => {},
});
export default FormContext;
