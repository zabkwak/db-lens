import Connection from '../../../connection/connection';
import BaseDataManager from './base.data-manager';

export default class CollectionsDataManager extends BaseDataManager<string> {
	private _connection: Connection<any, any>;
	private _namespace: string;

	constructor(connection: Connection<any, any>, namespace: string) {
		super();
		this._connection = connection;
		this._namespace = namespace;
	}

	protected async _loadData(): Promise<string[]> {
		return this._connection.getCollections(this._namespace);
	}
}
