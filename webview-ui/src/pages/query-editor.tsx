import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import React, { useEffect, useState } from 'react';
import { IMessagePayload, IPostMessage } from '../../../shared/types';
import Table from '../components/table';
import Logger from '../logger';
import { TState } from '../types';
import { isCommand } from '../utils';
import { vscode } from '../vscode-api';
import './query-editor.scss';

const QueryEditor: React.FC = () => {
	const [query, setQuery] = useState("SELECT * FROM terminal where account_id = 'gi6d'");
	const [result, setResult] = useState<TState<IMessagePayload['result']>>(null);
	const [isLoading, setIsLoading] = useState(false);
	const handleMessage = (event: MessageEvent<IPostMessage<keyof IMessagePayload>>) => {
		const message = event.data;
		Logger.info('Received message from VS Code', { command: message.command });
		if (isCommand(message, 'result')) {
			setResult(message.payload);
			setIsLoading(false);
			return;
		}
		// if (message.command === 'error') {
		// 	setResult(null);
		// 	setIsLoading(false);
		// 	return;
		// }
	};
	const handleRunQuery = () => {
		setIsLoading(true);
		vscode.postMessage({
			command: 'query',
			payload: query,
		});
	};
	const handleQueryChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
		setQuery(e.currentTarget.value);
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && e.shiftKey) {
			e.preventDefault();
			handleRunQuery();
		}
	};

	useEffect(() => {
		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

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
			<hr />
			<section className="result-section">
				<Table data={result?.data || []} columns={result?.columns || []} loading={isLoading} />
			</section>
		</div>
	);
};

export default QueryEditor;
