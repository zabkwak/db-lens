import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import React, { useEffect, useState } from 'react';
import { driverOptions, drivers, passwordProviderOptions, passwordProviders } from '../../../shared/configuration';
import { IConnectionConfiguration, IMessagePayload, IPostMessage } from '../../../shared/types';
import { isCommand } from '../../../shared/utils';
import Alert from '../components/alert';
import FormControl, { TType } from '../components/form-control';
import FormGroup from '../components/form-group';
import Logger from '../logger';
import { classNames } from '../utils';
import { vscode } from '../vscode-api';
import './config.scss';

const Config: React.FC<IConnectionConfiguration> = (props) => {
	const [isUpdate] = useState(!!props.name);
	const [name, setName] = useState(props.name);
	const [isSSHTunnelEnabled] = useState(!!props.sshTunnelOptions);
	const [sshTunnelHost, setSshTunnelHost] = useState(props.sshTunnelOptions?.host || '');
	const [sshTunnelPort, setSshTunnelPort] = useState(props.sshTunnelOptions?.port || 22);
	const [sshTunnelUsername, setSshTunnelUsername] = useState(props.sshTunnelOptions?.username || '');
	const [sshTunnelPrivateKey, setSshTunnelPrivateKey] = useState(props.sshTunnelOptions?.privateKey || '');
	const [sshTunnelPassphrase, setSshTunnelPassphrase] = useState(props.sshTunnelOptions?.passphrase || '');
	const [localPort, setLocalPort] = useState(props.sshTunnelOptions?.localPort || 8080);
	const [sshTunnelConnectionTimeout, setSshTunnelConnectionTimeout] = useState(
		props.sshTunnelOptions?.connectionTimeout || 10000,
	);
	const [driver, setDriver] = useState<keyof typeof driverOptions>(props.db?.driver || drivers[0]);
	const [passwordProvider, setPasswordProvider] = useState<keyof typeof passwordProviderOptions>(
		props.db?.passwordProvider?.name || passwordProviders[0],
	);
	const [dbCredentials, setDbCredentials] = useState(props.db?.credentials || {});
	const [passwordProviderConfig, setPasswordProviderConfig] = useState(props.db?.passwordProvider?.options || {});
	const [isLoading, setIsLoading] = useState(false);
	const [testConnectionSuccess, setTestConnectionSuccess] = useState<boolean | null>(null);

	const handleMessage = (event: MessageEvent<IPostMessage<keyof IMessagePayload>>) => {
		const message = event.data;
		if (message.command === 'ready') {
			return;
		}
		if (isCommand(message, 'testConnectionResult')) {
			setIsLoading(false);
			setTestConnectionSuccess(message.payload.success);
		}
	};
	const handleDriverChange = (value: string) => {
		setDriver(value as keyof typeof driverOptions);
		setDbCredentials({});
	};
	const handleDBCredentialsChange = (value: string | number | boolean, key: string | null) => {
		if (!key) {
			// shouldn't happen
			return;
		}
		setDbCredentials({
			...dbCredentials,
			[key]: value,
		});
	};
	const handlePasswordProviderChange = (value: string) => {
		setPasswordProvider(value as keyof typeof passwordProviderOptions);
		setPasswordProviderConfig({});
	};
	const handlePasswordProviderConfigChange = (value: string | number | boolean, key: string | null) => {
		if (!key) {
			// shouldn't happen
			return;
		}
		setPasswordProviderConfig({
			...passwordProviderConfig,
			[key]: value,
		});
	};
	const handleSave = () => {
		setIsLoading(true);
		vscode.postMessage({
			command: 'saveConnection',
			payload: {
				name,
				sshTunnelOptions: isSSHTunnelEnabled
					? {
							host: sshTunnelHost,
							port: sshTunnelPort,
							username: sshTunnelUsername,
							privateKey: sshTunnelPrivateKey,
							passphrase: sshTunnelPassphrase,
							connectionTimeout: sshTunnelConnectionTimeout,
							localPort,
					  }
					: undefined,
				db: {
					driver,
					credentials: dbCredentials,
					passwordProvider: {
						name: passwordProvider,
						options: passwordProviderConfig,
					},
				},
			},
		});
	};
	const handleTestConnection = () => {
		setIsLoading(true);
		setTestConnectionSuccess(null);
		vscode.postMessage({
			command: 'testConnection',
			payload: {
				name,
				sshTunnelOptions: isSSHTunnelEnabled
					? {
							host: sshTunnelHost,
							port: sshTunnelPort,
							username: sshTunnelUsername,
							privateKey: sshTunnelPrivateKey,
							passphrase: sshTunnelPassphrase,
							connectionTimeout: sshTunnelConnectionTimeout,
							localPort,
					  }
					: undefined,
				db: {
					driver,
					credentials: dbCredentials,
					passwordProvider: {
						name: passwordProvider,
						options: passwordProviderConfig,
					},
				},
			},
		});
	};

	useEffect(() => {
		Logger.info('Received configuration data', props);
		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [props]);

	return (
		<div className="config">
			<div className="form">
				<FormControl
					type="text"
					label="Connection name"
					placeholder="Enter connection name"
					value={name}
					onChange={setName}
					disabled={isUpdate || isLoading}
					required
				/>
				<FormGroup label="Enable SSH Tunnel" visible={isSSHTunnelEnabled} disabled={isLoading}>
					<FormControl
						type="text"
						label="SSH Host"
						placeholder="Enter SSH Host"
						value={sshTunnelHost}
						onChange={setSshTunnelHost}
						disabled={isLoading}
						required
					/>
					<FormControl
						type="number"
						label="SSH Port"
						placeholder="Enter SSH Port"
						value={sshTunnelPort}
						onChange={setSshTunnelPort}
						disabled={isLoading}
						required
					/>
					<FormControl
						type="text"
						label="SSH Username"
						placeholder="Enter SSH Username"
						value={sshTunnelUsername}
						onChange={setSshTunnelUsername}
						disabled={isLoading}
					/>
					<FormControl
						type="text"
						label="Private Key Path"
						placeholder="Enter Private Key Path"
						value={sshTunnelPrivateKey}
						onChange={setSshTunnelPrivateKey}
						disabled={isLoading}
					/>
					<FormControl
						type="text"
						label="Passphrase (if required)"
						placeholder="Enter Passphrase (if required)"
						value={sshTunnelPassphrase}
						onChange={setSshTunnelPassphrase}
						disabled={isLoading}
					/>
					<FormControl
						type="number"
						label="Local Port"
						placeholder="Enter local port"
						value={localPort}
						onChange={setLocalPort}
						disabled={isLoading}
					/>
					<FormControl
						type="number"
						label="Connection Timeout (ms)"
						placeholder="Enter Connection Timeout (ms)"
						value={sshTunnelConnectionTimeout}
						onChange={setSshTunnelConnectionTimeout}
						disabled={isLoading}
					/>
				</FormGroup>
				<FormControl
					type="select"
					label="Database Driver"
					value={driver}
					onChange={handleDriverChange}
					options={Object.keys(driverOptions).map((driver) => ({
						label: driver,
						value: driver,
					}))}
					disabled={isLoading}
				/>
				<FormGroup hidable={false} disabled={isLoading}>
					{driverOptions[driver]?.map((option) => (
						<FormControl
							key={option.key}
							name={option.key}
							label={option.label}
							type={option.type as TType}
							placeholder={option.placeholder}
							value={dbCredentials[option.key] ?? option.defaultValue}
							onChange={handleDBCredentialsChange}
							disabled={isLoading}
						/>
					))}
					<FormControl
						type="select"
						label="Password Provider"
						value={passwordProvider}
						onChange={handlePasswordProviderChange}
						options={Object.keys(passwordProviderOptions).map((provider) => ({
							label: provider,
							value: provider,
						}))}
						disabled={isLoading}
					/>
					<FormGroup hidable={false} disabled={isLoading}>
						{passwordProviderOptions[passwordProvider]?.map((option) => (
							<FormControl
								key={option.key}
								name={option.key}
								label={option.label}
								type={option.type as TType}
								placeholder={option.placeholder}
								value={passwordProviderConfig[option.key] ?? option.defaultValue}
								onChange={handlePasswordProviderConfigChange}
								disabled={isLoading}
							/>
						))}
					</FormGroup>
				</FormGroup>
			</div>
			<div className="buttons">
				<div className="left-group">
					<VSCodeButton
						className={classNames('button', 'test-connection', testConnectionSuccess ? 'success' : null)}
						onClick={handleTestConnection}
						disabled={isLoading}
					>
						Test connection
					</VSCodeButton>
					{testConnectionSuccess === true ? (
						<Alert variant="success">Test connection successful!</Alert>
					) : null}
					{testConnectionSuccess === false ? <Alert variant="error">Test connection failed!</Alert> : null}
				</div>
				<div className="right-group">
					<VSCodeButton className="button close" disabled={isLoading}>
						Close
					</VSCodeButton>
					<VSCodeButton className="button save" onClick={handleSave} disabled={isLoading}>
						Save
					</VSCodeButton>
				</div>
			</div>
		</div>
	);
};

export default Config;
