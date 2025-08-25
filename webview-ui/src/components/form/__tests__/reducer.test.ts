import { expect } from 'vitest';
import formReducer from '../reducer';

describe('formReducer', () => {
	it('should return correct state for "UPDATE_VALUE" action on default state', () => {
		const newState = formReducer(
			{
				formData: {},
				errors: {},
				loading: false,
			},
			{
				type: 'UPDATE_VALUE',
				payload: {
					name: 'value',
					value: 'test',
					required: true,
				},
			},
		);
		expect(newState).toEqual({
			formData: {
				value: {
					value: 'test',
					required: true,
				},
			},
			errors: {},
			loading: false,
		});
	});

	it('should return correct state for "UPDATE_VALUE" action on existing state', () => {
		const newState = formReducer(
			{
				formData: {
					value: {
						value: 'existing',
						required: false,
					},
				},
				errors: {},
				loading: false,
			},
			{
				type: 'UPDATE_VALUE',
				payload: {
					name: 'value',
					value: 'test',
					required: false,
				},
			},
		);
		expect(newState).toEqual({
			formData: {
				value: {
					value: 'test',
					required: false,
				},
			},
			errors: {},
			loading: false,
		});
	});

	it('should clear the value on "CLEAR_PROPERTY" action', () => {
		const newState = formReducer(
			{
				formData: {
					value: {
						value: 'existing',
						required: false,
					},
				},
				errors: {},
				loading: false,
			},
			{
				type: 'CLEAR_PROPERTY',
				payload: {
					name: 'value',
				},
			},
		);
		expect(newState).toEqual({
			formData: {},
			errors: {},
			loading: false,
		});
	});

	it('should set errors on "VALIDATION_ERRORS" action', () => {
		const newState = formReducer(
			{
				formData: {},
				errors: {},
				loading: false,
			},
			{
				type: 'VALIDATION_ERRORS',
				payload: [
					{
						name: 'value',
						error: 'Value is required',
					},
				],
			},
		);
		expect(newState).toEqual({
			formData: {},
			errors: {
				value: 'Value is required',
			},
			loading: false,
		});
	});

	it('should clear errors on "VALIDATION_ERRORS" action with empty array', () => {
		const newState = formReducer(
			{
				formData: {},
				errors: {
					value: 'Value is required',
				},
				loading: false,
			},
			{
				type: 'VALIDATION_ERRORS',
				payload: [],
			},
		);
		expect(newState).toEqual({
			formData: {},
			errors: {},
			loading: false,
		});
	});

	it('should set loading on "SET_LOADING" action', () => {
		const newState = formReducer(
			{
				formData: {},
				errors: {},
				loading: false,
			},
			{
				type: 'SET_LOADING',
				payload: { loading: true },
			},
		);
		expect(newState).toEqual({
			formData: {},
			errors: {},
			loading: true,
		});
	});
});
