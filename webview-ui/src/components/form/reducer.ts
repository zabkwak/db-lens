import { set } from 'lodash';
import { IFormAction, IFormActionPayload, IFormContextState } from './context';

export default function formReducer<T extends keyof IFormActionPayload>(
	state: IFormContextState,
	action: IFormAction<T>,
): IFormContextState {
	if (isActionType(action, 'UPDATE_VALUE')) {
		const { name, value, required } = action.payload;
		const parts = name.split('.');
		return {
			...state,
			formData: set(state.formData, parts, { value, required }),
		};
	}
	if (isActionType(action, 'CLEAR_PROPERTY')) {
		const { name } = action.payload;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [name]: _, ...formData } = state.formData;
		return {
			...state,
			formData,
		};
	}
	if (isActionType(action, 'VALIDATION_ERRORS')) {
		const errors = action.payload;
		return {
			...state,
			errors: errors.reduce((acc, { name, error }) => {
				return {
					...acc,
					[name]: error,
				};
			}, {} as Record<string, string>),
		};
	}
	if (isActionType(action, 'SET_LOADING')) {
		const { loading } = action.payload;
		return {
			...state,
			loading,
		};
	}
	return state;
}

function isActionType<T extends keyof IFormActionPayload>(
	action: IFormAction<keyof IFormActionPayload>,
	type: T,
): action is IFormAction<T> {
	return action.type === type;
}
