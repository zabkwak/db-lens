import Connection, { IConnectionGroup } from './connection';

export default class ConnectionGroup {
	private _name: string;
	private _children: (Connection<any, any> | ConnectionGroup)[];

	constructor(config: IConnectionGroup) {
		this._name = config.name;
		this._children = config.connections.map((connection) => {
			if ('connections' in connection) {
				return new ConnectionGroup(connection);
			}
			return new Connection(connection);
		});
	}

	public addChild(child: Connection<any, any> | ConnectionGroup): void {
		if (this._children.find((c) => c.getName() === child.getName())) {
			throw new Error(`Child with name ${child.getName()} already exists in group ${this._name}`);
		}
		this._children.push(child);
	}

	public updateChild(child: Connection<any, any> | ConnectionGroup): void {
		const index = this._children.findIndex((c) => c.getName() === child.getName());
		if (index === -1) {
			throw new Error(`Child with name ${child.getName()} not found in group ${this._name}`);
		}
		this._children[index] = child;
	}

	public removeChild(child: Connection<any, any> | ConnectionGroup): void {
		this._children = this._children.filter((c) => c.getName() !== child.getName());
	}

	public getName(): string {
		return this._name;
	}

	public getChildren(): (Connection<any, any> | ConnectionGroup)[] {
		return this._children;
	}

	public toJSON(): IConnectionGroup {
		return {
			name: this._name,
			connections: this._children.map((c) => c.toJSON()),
		};
	}
}
