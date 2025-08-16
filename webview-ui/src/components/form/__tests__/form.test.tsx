import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import FormControl from '../../form-control';
import Form, { IFormRef } from '../form';

describe('<Form />', () => {
	it('renders form component', async () => {
		const ref = createRef<IFormRef>();
		const { container } = render(
			<Form ref={ref}>
				<FormControl type="text" name="test" defaultValue="test" />
			</Form>,
		);
		const control = container.querySelector('.form-control') as HTMLElement;
		expect(container).toBeInTheDocument();
		expect(control).toBeInTheDocument();

		const vscodeTextField = control.querySelector('.control.text-field');
		const input = vscodeTextField?.shadowRoot?.querySelector('input') as HTMLInputElement;
		expect(vscodeTextField?.querySelector('input')?.value).toEqual('test');
		await act(async () => {
			input.value = 'value';
			input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
		});
		expect(ref.current?.getData()).toEqual({ test: 'value' });
		expect(ref.current?.isValid()).toEqual(true);
	});
});
