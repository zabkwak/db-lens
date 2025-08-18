import { ok, strictEqual } from 'assert';
import sinon from 'sinon';
import { TreeItemCollapsibleState } from 'vscode';
import Connection from '../../../connection/connection';
import ConnectionManager from '../../../connection/connection-manager';
import ConnectionTreeProvider from '../connection-tree-provider';
import CollectionTreeItem from '../tree-items/collection.tree-item';
import ConnectionTreeItem from '../tree-items/connection.tree-item';
import LoadingTreeItem from '../tree-items/loading.tree-item';
import WarningTreeItem from '../tree-items/warning.tree-item';

suite('ConnectionTreeProvider', () => {
	let provider: ConnectionTreeProvider;
	let getConnectionsStub: sinon.SinonStub;

	suiteSetup(() => {
		provider = new ConnectionTreeProvider();
		getConnectionsStub = sinon.stub(ConnectionManager, 'getConnections');
	});

	suiteTeardown(() => {
		sinon.restore();
	});

	suite('.getChildren', () => {
		suite('Root', () => {
			test('should return loading tree item', () => {
				getConnectionsStub.returns(null);
				const children = provider.getChildren();
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof LoadingTreeItem);
				strictEqual(child.label, 'Loading...');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return warning tree item when no connections found', () => {
				getConnectionsStub.returns([]);
				const children = provider.getChildren();
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof WarningTreeItem);
				strictEqual(child.label, 'No connections found');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return connection tree items', () => {
				getConnectionsStub.returns([
					{
						getName() {
							return 'Connection 1';
						},
					},
					{
						getName() {
							return 'Connection 2';
						},
					},
				]);
				const children = provider.getChildren();
				strictEqual(children.length, 2);
				const [child1, child2] = children;
				ok(child1 instanceof ConnectionTreeItem);
				ok(child2 instanceof ConnectionTreeItem);
				strictEqual(child1.label, 'Connection 1');
				strictEqual(child1.collapsibleState, TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				strictEqual(child1.iconPath.id, 'database');
				// @ts-expect-error
				strictEqual(child1.iconPath.color, undefined);
				strictEqual(child2.label, 'Connection 2');
				strictEqual(child2.collapsibleState, TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				strictEqual(child2.iconPath.id, 'database');
				// @ts-expect-error
				strictEqual(child2.iconPath.color, undefined);
			});
		});

		suite('ConnectionTreeItem', () => {
			test('should return warning tree item when connection failed', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					getCollections() {
						return null;
					},
					failed() {
						return true;
					},
					hasCollections() {
						return false;
					},
					isConnected() {
						return false;
					},
					isConnecting() {
						return false;
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				ok(sinon.stub(mockConnection, 'connect').notCalled);
				ok(sinon.stub(mockConnection, 'loadCollections').notCalled);

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof WarningTreeItem);
				strictEqual(child.label, 'Connection failed: Connection 1');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return loading tree item when connection is connecting', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					getCollections() {
						return null;
					},
					failed() {
						return false;
					},
					hasCollections() {
						return false;
					},
					isConnected() {
						return false;
					},
					isConnecting() {
						return false;
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				ok(sinon.stub(mockConnection, 'connect').resolves());
				ok(sinon.stub(mockConnection, 'loadCollections').notCalled);

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof LoadingTreeItem);
				strictEqual(child.label, 'Connecting...');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return loading tree item when collections are loading', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					getCollections() {
						return null;
					},
					failed() {
						return false;
					},
					hasCollections() {
						return false;
					},
					isConnected() {
						return true;
					},
					isConnecting() {
						return false;
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				ok(sinon.stub(mockConnection, 'connect').notCalled);
				ok(sinon.stub(mockConnection, 'loadCollections').resolves());

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof LoadingTreeItem);
				strictEqual(child.label, 'Loading collections...');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return warning tree item when connection has no collections', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					getCollections() {
						return [];
					},
					failed() {
						return false;
					},
					hasCollections() {
						return true;
					},
					isConnected() {
						return true;
					},
					isConnecting() {
						return false;
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				ok(sinon.stub(mockConnection, 'connect').notCalled);
				ok(sinon.stub(mockConnection, 'loadCollections').notCalled);

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));
				strictEqual(children.length, 1);
				const [child] = children;
				ok(child instanceof WarningTreeItem);
				strictEqual(child.label, 'No collections found');
				strictEqual(child.collapsibleState, TreeItemCollapsibleState.None);
			});

			test('should return collection tree item when connection has collections', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					getCollections() {
						return ['Collection 1', 'Collection 2'];
					},
					failed() {
						return false;
					},
					hasCollections() {
						return true;
					},
					isConnected() {
						return true;
					},
					isConnecting() {
						return false;
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				ok(sinon.stub(mockConnection, 'connect').notCalled);
				ok(sinon.stub(mockConnection, 'loadCollections').notCalled);

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));
				strictEqual(children.length, 2);
				const [child1, child2] = children;
				ok(child1 instanceof CollectionTreeItem);
				strictEqual(child1.label, 'Collection 1');
				strictEqual(child1.collapsibleState, TreeItemCollapsibleState.Collapsed);
				ok(child2 instanceof CollectionTreeItem);
				strictEqual(child2.label, 'Collection 2');
				strictEqual(child2.collapsibleState, TreeItemCollapsibleState.Collapsed);
			});
		});
	});
});
