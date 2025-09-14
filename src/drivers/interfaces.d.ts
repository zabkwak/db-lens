import { EQueryCommand } from '../../shared/types';

export interface IQueryResultCollectionPropertyDescription {
	name: string;
	// TODO enum?
	type: string;
}

export interface IQueryResult<T> {
	data: T[];
	properties: IQueryResultCollectionPropertyDescription[];
	rowCount: number | null;
	command: EQueryCommand;
	commit: () => Promise<void>;
	rollback: () => Promise<void>;
}

export interface ICollectionPropertyDescription {
	name: string;
	type: string;
	isNullable: boolean;
	defaultValue: string | null;
	isPrimaryKey: boolean;
}

export interface IViewsDriver {
	getViews(namespace: string): Promise<string[]>;
}

export interface IIndexesDriver {
	getIndexes(namespace: string, collectionName: string): Promise<IIndexDescription[]>;
}

export interface ISqlDriver extends IViewsDriver, IIndexesDriver {}

export interface IIndexDescription {
	name: string;
	kind: 'PRIMARY KEY' | 'UNIQUE' | 'INDEX';
	type: string;
	columns: string[];
}
