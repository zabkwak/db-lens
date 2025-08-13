import React from 'react';

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI.
		return { hasError: true, error: error };
	}

	public state: State = {
		hasError: false,
		error: null,
	};

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error({ error, errorInfo });
		// Send the error details back to the extension to be logged.
		// vscodeApi.postMessage({
		// 	command: 'logError',
		// 	payload: {
		// 		message: `[React Render Error] ${error.message}`,
		// 		errorStack: error.stack,
		// 		componentStack: errorInfo.componentStack,
		// 	},
		// });
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: '1rem', color: 'var(--vscode-errorForeground)' }}>
					<h2>Something went wrong in the UI</h2>
					<pre
						style={{
							backgroundColor: 'var(--vscode-textBlockQuote-background)',
							padding: '1rem',
							borderRadius: '4px',
							whiteSpace: 'pre-wrap',
						}}
					>
						{this.state.error?.message}
						{'\n\n'}
						{this.state.error?.stack}
					</pre>
				</div>
			);
		}

		return this.props.children;
	}
}
