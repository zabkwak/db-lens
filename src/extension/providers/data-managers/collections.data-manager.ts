import Connection from '../../../connection/connection';
import BaseDataManager from './base.data-manager';

export default class CollectionsDataManager extends BaseDataManager<string> {
	private _connection: Connection<any, any>;

	constructor(connection: Connection<any, any>) {
		super();
		this._connection = connection;
	}

	protected async _loadData(): Promise<string[]> {
		// TODO make this as one method?
		await this._connection.loadCollections();
		console.log('Loading collections', this._connection.getCollections());
		return this._connection.getCollections();
	}
}
