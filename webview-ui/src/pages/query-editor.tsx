import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import React, { useEffect, useState } from 'react';
import { IMessagePayload, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import Table from '../components/table';
import Logger from '../logger';
import Request from '../request';
import { TState } from '../types';
import { vscode } from '../vscode-api';
import './query-editor.scss';

const QueryEditor: React.FC = () => {
	const [query, setQuery] = useState("SELECT * FROM terminal where account_id = 'gi6d'");
	const [result, setResult] = useState<TState<IMessagePayload['query.result']['data']>>(null);
	const [isLoading, setIsLoading] = useState(false);
	const handleMessage = (event: MessageEvent<IPostMessage<keyof IMessagePayload>>) => {
		const message = event.data;
		Logger.info('Received message from VS Code', { command: message.command });
		if (isCommand(message, 'query.result')) {
			const { payload } = message;
			setIsLoading(false);
			if (!payload.success) {
				return;
			}
			setResult(payload.data);
			return;
		}
	};
	async function handleRunQuery(): Promise<void> {
		setIsLoading(true);
		try {
			await Request.request('query', { query }, 30000);
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
