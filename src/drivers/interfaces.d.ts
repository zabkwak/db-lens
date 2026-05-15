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
	duration: number;
	command: EQueryCommand;
	commit: () => Promise<void>;
	rollback: () => Promise<void>;
}

export interface IExplainResult {
	plan: string[];
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

export interface ISqlDriver extends IViewsDriver, IIndexesDriver {
	explain(query: string): Promise<IExplainResult>;
	explain(query: string, timeout: number): Promise<IExplainResult>;
	explain(query: string, timeout: number, namespace: string): Promise<IExplainResult>;

	explainAnalyze(query: string): Promise<IExplainResult>;
	explainAnalyze(query: string, timeout: number): Promise<IExplainResult>;
	explainAnalyze(query: string, timeout: number, namespace: string): Promise<IExplainResult>;
}

export interface IIndexDescription {
	name: string;
	kind: 'PRIMARY KEY' | 'UNIQUE' | 'INDEX';
	type: string;
	columns: string[];
}

export interface IMySQLExplainRow {
	id: number | null;
	select_type: string | null;
	table: string | null;
	partitions?: string | null;
	type: string | null;
	possible_keys: string | null;
	key: string | null;
	key_len: string | null;
	ref: string | null;
	rows: number | null;
	filtered?: number | null; // MySQL 5.7 sometimes omits this
	Extra: string | null;
}
