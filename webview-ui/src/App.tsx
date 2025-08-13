import React, { useEffect, useState } from 'react';
import { IMessagePayload, IPostMessage } from '../../shared/types';
import './App.css';
import Loader from './components/loader';
import Config from './pages/config';
import QueryEditor from './pages/query-editor';
import { vscode } from './vscode-api';

const isCommand = <T extends keyof IMessagePayload>(
	message: IPostMessage<keyof IMessagePayload>,
	command: T,
): message is IPostMessage<T> => {
	return message.command === command;
};

const App: React.FC = () => {
	const [route, setRoute] = useState<string | null>(null);
	const [initialData, setInitialData] = useState<any | null>(null);

	const handleMessage = (event: MessageEvent<IPostMessage<keyof IMessagePayload>>) => {
		const message = event.data;
		if (isCommand(message, 'navigation')) {
			setRoute(message.payload.route);
			if (message.payload.data) {
				setInitialData(message.payload.data);
			}
			return;
		}
		// if (message.command === 'error') {
		// 	setResult(null);
		// 	setIsLoading(false);
		// 	return;
		// }
	};

	useEffect(() => {
		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);
	useEffect(() => {
		vscode.postMessage({
			command: 'ready',
			payload: null,
		});
	}, []);

	if (!route) {
		return <Loader />;
	}

	return (
		<main>
			{route === 'db-lens.config' ? <Config {...initialData} /> : null}
			{route === 'db-lens.queryEditor' ? <QueryEditor {...initialData} /> : null}
		</main>
	);
};

export default App;
