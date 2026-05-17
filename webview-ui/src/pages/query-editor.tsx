import { VSCodeButton, VSCodeDivider, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import React, { useState } from 'react';
import { IMessagePayload, TPlatform } from '../../../shared/types';
import FormControl from '../components/form-control';
import Loader from '../components/loader';
import Table from '../components/table';
import Request from '../request';
import { TState } from '../types';
import { vscode } from '../vscode-api';
import './query-editor.scss';

type TResult = 'query.result' | 'query.explain.result' | 'query.explainAnalyze.result';

interface IResult<T extends TResult> {
	type: T;
	data: IMessagePayload[T]['data'];
}

interface IProps {
	platform: TPlatform;
}

function isResultType<T extends TResult>(
	type: T,
	result: IResult<TResult>,
): result is IResult<T> & { type: T; data: IMessagePayload[T]['data'] } {
	return result.type === type;
}

const QueryEditor: React.FC<IProps> = (props) => {
	const [query, setQuery] = useState('');
	const [result, setResult] = useState<TState<IResult<TResult>>>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [timeout, setTimeout] = useState(30000);
	async function handleRunQuery(): Promise<void> {
		await execute('query', 'query.result', { query, timeout });
	}
	async function handleRunExplain(): Promise<void> {
		await execute('query.explain', 'query.explain.result', { query, timeout });
	}
	async function handleRunExplainAnalyze(): Promise<void> {
		await execute('query.explainAnalyze', 'query.explainAnalyze.result', {
			query,
			timeout,
		});
	}
	async function execute<T extends keyof IMessagePayload>(
		requestCommand: T,
		resultCommand: TResult,
		payload: IMessagePayload[T],
	): Promise<void> {
		setIsLoading(true);
		setResult(null);
		try {
			const result = await Request.request<T, TResult>(
				requestCommand,
				payload,
				// let the request timeout be long enough to let the query to fail
				Math.max(30000, 30000 + timeout),
				// 'test',
			);
			setResult({
				type: resultCommand,
				data: result.data,
			});
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
		const cmdOrCtrl = props.platform === 'darwin' ? e.metaKey : e.ctrlKey;
		if (e.key === 'Enter' && cmdOrCtrl) {
			e.preventDefault();
			handleRunQuery();
		}
	};
	function renderData(): React.ReactNode {
		if (result === null) {
			if (isLoading) {
				return <Loader />;
			}
			return null;
		}
		if (isResultType('query.result', result)) {
			return (
				<Table
					data={result.data?.data}
					columns={result.data?.columns}
					loading={isLoading}
					rows={result.data?.rowCount ?? undefined}
					duration={result.data?.duration ?? undefined}
				/>
			);
		}
		if (isResultType('query.explain.result', result) || isResultType('query.explainAnalyze.result', result)) {
			if (isLoading) {
				return <Loader />;
			}
			if (!result.data) {
				return null;
			}
			if (!result.data.plan.length) {
				return <p>No plan available.</p>;
			}
			return <pre>{result.data.plan.join('\n')}</pre>;
		}
		return null;
	}

	return (
		<div className="query-editor">
			<section className="query-section">
				<div className="input">
					<VSCodeTextArea
						className="query-input"
						value={query}
						// @ts-expect-error some weird typings
						onInput={handleQueryChange}
						rows={10}
						resize="vertical"
						onKeyDown={handleKeyDown}
					>
						Query
					</VSCodeTextArea>
					<FormControl label="Timeout (ms)" value={timeout} type="number" onChange={setTimeout} />
				</div>
				<div className="controls">
					<VSCodeButton className="button" onClick={handleRunQuery} disabled={isLoading}>
						Run Query
					</VSCodeButton>
					<VSCodeButton className="button" onClick={handleRunExplain} disabled={isLoading}>
						Explain
					</VSCodeButton>
					<VSCodeButton className="button" onClick={handleRunExplainAnalyze} disabled={isLoading}>
						Explain Analyze
					</VSCodeButton>
				</div>
			</section>
			<VSCodeDivider />
			<section className="result-section">{renderData()}</section>
		</div>
	);
};

export default QueryEditor;
