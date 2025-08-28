import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import React, { useState } from 'react';
import { IMessagePayload } from '../../../shared/types';
import Table from '../components/table';
import Request from '../request';
import { TState } from '../types';
import { vscode } from '../vscode-api';
import './query-editor.scss';

const QueryEditor: React.FC = () => {
	const [query, setQuery] = useState('');
	const [result, setResult] = useState<TState<IMessagePayload['query.result']['data']>>(null);
	const [isLoading, setIsLoading] = useState(false);
	async function handleRunQuery(): Promise<void> {
		setIsLoading(true);
		try {
			const result = await Request.request<'query', 'query.result'>('query', { query }, 30000, 'test');
			setResult(result.data);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			vscode.postMessage({
				command: 'error',
				payload: { message: error.message },
			});
		} finally {
			setIsLoading(false);
		}
	}
	const handleQueryChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
		setQuery(e.currentTarget.value);
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			handleRunQuery();
		}
	};

	return (
		<div className="query-editor">
			<section className="query-section">
				<VSCodeTextArea
					className="query-input"
					value={query}
					// @ts-expect-error some weird typings
					onInput={handleQueryChange}
					rows={10}
					resize="none"
					onKeyDown={handleKeyDown}
				>
					Query
				</VSCodeTextArea>
				<VSCodeButton className="query-button" onClick={handleRunQuery} disabled={isLoading}>
					Run Query
				</VSCodeButton>
			</section>
			<VSCodeDivider />
			<section className="result-section">
				<Table data={result?.data} columns={result?.columns} loading={isLoading} />
			</section>
		</div>
	);
};

export default QueryEditor;
