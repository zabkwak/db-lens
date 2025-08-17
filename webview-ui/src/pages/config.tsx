import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import React, { useRef, useState } from 'react';
import { driverOptions, drivers, passwordProviderOptions, passwordProviders } from '../../../shared/configuration';
import { IConnectionConfiguration } from '../../../shared/types';
import Alert from '../components/alert';
import FormControl, { TType } from '../components/form-control';
import FormGroup from '../components/form-group';
import Form, { IFormData, IFormRef } from '../components/form/form';
import Logger from '../logger';
import Request from '../request';
import { classNames } from '../utils';
import './config.scss';

const Config: React.FC<IConnectionConfiguration> = (props) => {
	const [isUpdate, setIsUpdate] = useState(!!props.name);
	const [isSSHTunnelEnabled] = useState(!!props.sshTunnelOptions);
	const [driver, setDriver] = useState<keyof typeof driverOptions>(props.db?.driver || drivers[0]);
	const [passwordProvider, setPasswordProvider] = useState<keyof typeof passwordProviderOptions>(
		props.db?.passwordProvider?.name || passwordProviders[0],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [testConnectionSuccess, setTestConnectionSuccess] = useState<boolean | null>(null);

	function handleDriverChange(value: string) {
		setDriver(value as keyof typeof driverOptions);
		formRef.current?.clearProperty('dbCredentials');
	}
	function handlePasswordProviderChange(value: string) {
		setPasswordProvider(value as keyof typeof passwordProviderOptions);
		formRef.current?.clearProperty('passwordProviderConfig');
	}
	function handleSave() {
		formRef.current?.submit();
	}
	async function handleTestConnection() {
		setIsLoading(true);
		setTestConnectionSuccess(null);
		if (!formRef.current?.isValid()) {
			Logger.warn('Form is invalid');
			return;
		}
		const data = formRef.current?.getData();
		try {
			const response = await Request.request<'testConnection', 'testConnectionResult'>(
				'testConnection',
				{
					name: data.name as string,
					sshTunnelOptions: isSSHTunnelEnabled
						? (data.sshTunnel as IConnectionConfiguration['sshTunnelOptions'])
						: undefined,
					db: {
						driver,
						credentials: data.dbCredentials as Record<string, unknown>,
						passwordProvider: {
							name: passwordProvider,
							options: data.passwordProviderConfig as Record<string, unknown>,
						},
					},
				},
				30000,
			);
			setTestConnectionSuccess(response.success);
		} catch (error) {
			Logger.error('Failed to test connection', { error });
			setTestConnectionSuccess(false);
		} finally {
			setIsLoading(false);
		}
	}
	async function handleSubmit(data: IFormData): Promise<void> {
		setIsLoading(true);
		try {
			const response = await Request.request<'saveConnection', 'saveConnectionResult'>('saveConnection', {
				name: data.name as string,
				sshTunnelOptions: isSSHTunnelEnabled
					? (data.sshTunnel as IConnectionConfiguration['sshTunnelOptions'])
					: undefined,
				db: {
					driver,
					credentials: data.dbCredentials as Record<string, unknown>,
					passwordProvider: {
						name: passwordProvider,
						options: data.passwordProviderConfig as Record<string, unknown>,
					},
				},
			});
			if (response.success) {
				// TODO handle success
				if (!isUpdate) {
					setIsUpdate(true);
				}
			}
		} catch (error) {
			Logger.error('Failed to save connection', { error });
		} finally {
			setIsLoading(false);
		}
	}

	const formRef = useRef<IFormRef>(null);

	return (
		<div className="config">
			<Form ref={formRef} onSubmit={handleSubmit}>
				<div className="form">
					<FormControl
						name="name"
						type="text"
						label="Connection name"
						placeholder="Enter connection name"
						disabled={isUpdate || isLoading}
						required
						defaultValue={props.name}
					/>
					<FormGroup label="Enable SSH Tunnel" visible={isSSHTunnelEnabled} disabled={isLoading}>
						<FormControl
							name="sshTunnel.host"
							type="text"
							label="SSH Host"
							placeholder="Enter SSH Host"
							disabled={isLoading}
							required
							defaultValue={props.sshTunnelOptions?.host || ''}
						/>
						<FormControl
							name="sshTunnel.port"
							type="number"
							label="SSH Port"
							placeholder="Enter SSH Port"
							disabled={isLoading}
							required
							defaultValue={props.sshTunnelOptions?.port || 22}
						/>
						<FormControl
							name="sshTunnel.username"
							type="text"
							label="SSH Username"
							placeholder="Enter SSH Username"
							disabled={isLoading}
							defaultValue={props.sshTunnelOptions?.username || ''}
						/>
						<FormControl
							name="sshTunnel.privateKey"
							type="text"
							label="Private Key Path"
							placeholder="Enter Private Key Path"
							disabled={isLoading}
							defaultValue={props.sshTunnelOptions?.privateKey || ''}
						/>
						<FormControl
							name="sshTunnel.passphrase"
							type="text"
							label="Passphrase (if required)"
							placeholder="Enter Passphrase (if required)"
							disabled={isLoading}
							defaultValue={props.sshTunnelOptions?.passphrase || ''}
						/>
						<FormControl
							name="sshTunnel.localPort"
							type="text"
							label="Local Port"
							placeholder="Enter local port"
							disabled={isLoading}
							defaultValue={props.sshTunnelOptions?.localPort?.toString() ?? ''}
						/>
						<FormControl
							name="sshTunnel.connectionTimeout"
							type="number"
							label="Connection Timeout (ms)"
							placeholder="Enter Connection Timeout (ms)"
							disabled={isLoading}
							defaultValue={props.sshTunnelOptions?.connectionTimeout ?? 10000}
						/>
					</FormGroup>
					<FormControl
						// name="driver"
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
								name={`dbCredentials.${option.key}`}
								label={option.label}
								type={option.type as TType}
								placeholder={option.placeholder}
								disabled={isLoading}
								required={option.required}
								defaultValue={props.db?.credentials[option.key] ?? option.defaultValue}
							/>
						))}
						<FormControl
							// name="passwordProvider"
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
									name={`passwordProviderConfig.${option.key}`}
									label={option.label}
									type={option.type as TType}
									placeholder={option.placeholder}
									disabled={isLoading}
									required={option.required}
									defaultValue={props.db?.passwordProvider.options[option.key] ?? option.defaultValue}
								/>
							))}
						</FormGroup>
					</FormGroup>
				</div>
			</Form>
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
