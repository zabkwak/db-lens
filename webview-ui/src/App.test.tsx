import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('<App />', () => {
	it('renders app component', () => {
		const { container } = render(<App />);
		expect(container.querySelector('.loading-indicator')).toBeInTheDocument();
		// TODO check if the ready command was sent
	});
});
