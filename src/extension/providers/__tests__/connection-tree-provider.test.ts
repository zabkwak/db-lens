import { expect } from 'chai';
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
				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(LoadingTreeItem);
				expect(child.label).to.equal('Loading...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
			});

			test('should return warning tree item when no connections found', () => {
				getConnectionsStub.returns([]);
				const children = provider.getChildren();
				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(WarningTreeItem);
				expect(child.label).to.equal('No connections found');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
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
				expect(children).to.have.lengthOf(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(ConnectionTreeItem);
				expect(child2).to.be.instanceOf(ConnectionTreeItem);
				expect(child1.label).to.equal('Connection 1');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('database');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child2.label).to.equal('Connection 2');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('database');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
			});
		});

		suite('ConnectionTreeItem', () => {
			suiteSetup(() => {
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
			});

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
				const connectStub = sinon.stub(mockConnection, 'connect');
				const loadCollectionsStub = sinon.stub(mockConnection, 'loadCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));

				expect(connectStub.notCalled).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(WarningTreeItem);
				expect(child.label).to.equal('Connection failed: Connection 1');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
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
					async connect() {
					},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const loadCollectionsStub = sinon.stub(mockConnection, 'loadCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));

				expect(connectStub.calledOnce).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(LoadingTreeItem);
				expect(child.label).to.equal('Connecting...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
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
				const connectStub = sinon.stub(mockConnection, 'connect');
				const loadCollectionsStub = sinon.stub(mockConnection, 'loadCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));

				expect(connectStub.notCalled).to.be.true;
				expect(loadCollectionsStub.calledOnce).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(LoadingTreeItem);
				expect(child.label).to.equal('Loading collections...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
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
				const connectStub = sinon.stub(mockConnection, 'connect');
				const loadCollectionsStub = sinon.stub(mockConnection, 'loadCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));

				expect(connectStub.notCalled).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(WarningTreeItem);
				expect(child.label).to.equal('No collections found');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
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
				const connectStub = sinon.stub(mockConnection, 'connect');
				const loadCollectionsStub = sinon.stub(mockConnection, 'loadCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection));

				expect(connectStub.notCalled).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(CollectionTreeItem);
				expect(child1.label).to.equal('Collection 1');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('folder');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child2).to.be.instanceOf(CollectionTreeItem);
				expect(child2.label).to.equal('Collection 2');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('folder');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
			});
		});

		suite('CollectionTreeItem', () => {
			suiteSetup(() => {
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
			});

			test('should return empty children', () => {
				const children = provider.getChildren(new CollectionTreeItem('Collection 1'));
				expect(children).to.be.empty;
			});
		});
	});
});
