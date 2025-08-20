export default abstract class BaseDataManager<T> {
	private _data: T[] | null = null;

	public async load(): Promise<void> {
		this._data = await this._loadData();
	}

	public getData(): T[] | null {
		return this._data;
	}

	protected abstract _loadData(): Promise<T[]>;
}
