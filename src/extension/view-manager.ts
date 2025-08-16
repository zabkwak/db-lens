import ConnectionTreeProvider from './providers/connection-tree-provider';

export default class ViewManager {
	private static _connectionTreeProvider = new ConnectionTreeProvider();

	public static getConnectionTreeProvider(): ConnectionTreeProvider {
		return this._connectionTreeProvider;
	}
}
