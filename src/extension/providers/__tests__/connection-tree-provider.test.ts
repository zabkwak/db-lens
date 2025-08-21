import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { TreeItemCollapsibleState } from 'vscode';
import Connection from '../../../connection/connection';
import ConnectionManager from '../../../connection/connection-manager';
import BaseDriver, { ICollectionPropertyDescription, IQueryResult } from '../../../drivers/base';
import BasePasswordProvider from '../../../password-providers/base';
import Password from '../../../password-providers/password';
import ConnectionTreeProvider from '../connection-tree-provider';
import PropertiesDataManager from '../data-managers/properties.data-manager';
import CollectionTreeItem from '../tree-items/collection.tree-item';
import ConnectionTreeItem from '../tree-items/connection.tree-item';
import LoadingTreeItem from '../tree-items/loading.tree-item';
import PropertiesTreeItem from '../tree-items/properties.tree-item';
import TreeItem from '../tree-items/tree-item';
import WarningTreeItem from '../tree-items/warning.tree-item';

// TODO figure out how to set this up globally for extension tests
chai.use(chaiAsPromised);

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
					getDriver() {
						return {};
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
					getDriver() {
						return {};
					},
					async connect() {},
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
					getDriver() {
						return {};
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
					getDriver() {
						return {};
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
					getDriver() {
						return {};
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
			class MockDriver extends BaseDriver<{}, {}> {
				public connect(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				public close(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				public getCollections(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
					throw new Error('Method not implemented.');
				}
				public query<T>(query: string): Promise<IQueryResult<T>> {
					throw new Error('Method not implemented.');
				}
			}
			class MockPasswordProvider extends BasePasswordProvider<{}> {
				public getPassword(): Promise<Password> {
					throw new Error('Method not implemented.');
				}
			}

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

			test('should return list of Collection children for SQL collection', () => {
				const children = provider.getChildren(
					new CollectionTreeItem('Collection 1', new MockDriver({}, new MockPasswordProvider({}))),
				);
				expect(children).to.have.length(1);
				const [propertiesItem] = children;
				expect(propertiesItem).to.be.instanceOf(PropertiesTreeItem);
				expect(propertiesItem.label).to.equal('Columns');
				expect(propertiesItem.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(propertiesItem.iconPath.id).to.equal('symbol-property');
				// @ts-expect-error
				expect(propertiesItem.iconPath.color).to.be.undefined;
			});
		});

		suite('PropertiesTreeItem', () => {
			class MockDriver extends BaseDriver<{ validCollection?: boolean }, {}> {
				public connect(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				public close(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				public getCollections(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
					throw new Error('Method not implemented.');
				}
				public query<T>(query: string): Promise<IQueryResult<T>> {
					throw new Error('Method not implemented.');
				}
			}
			class MockPasswordProvider extends BasePasswordProvider<{}> {
				public getPassword(): Promise<Password> {
					throw new Error('Method not implemented.');
				}
			}
			suiteSetup(() => {
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
					getDriver() {
						return {};
					},
					async connect() {},
					async loadCollections() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
			});

			test('should return loading tree item', () => {
				const driver = new MockDriver({}, new MockPasswordProvider({}));
				const describeCollectionStub = sinon.stub(driver, 'describeCollection');
				const children = provider.getChildren(
					new PropertiesTreeItem('Columns', new PropertiesDataManager('Collection 1', driver)),
				);
				expect(describeCollectionStub.calledOnceWith('Collection 1')).to.be.true;
				expect(children).to.have.length(1);
				const [child1] = children;
				expect(child1).to.be.instanceOf(LoadingTreeItem);
				expect(child1.label).to.equal('Loading properties...');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.None);
			});

			test('should return warning tree item', async () => {
				const driver = new MockDriver({ validCollection: false }, new MockPasswordProvider({}));
				const describeCollectionStub = sinon
					.stub(driver, 'describeCollection')
					.throws(new Error('Failed to describe collection'));
				const propertiesTreeItem = new PropertiesTreeItem(
					'Columns',
					new PropertiesDataManager('Collection 1', driver),
				);
				await expect(propertiesTreeItem.load()).to.be.rejectedWith('Failed to describe collection');
				const children = provider.getChildren(propertiesTreeItem);
				expect(describeCollectionStub.calledOnceWith('Collection 1')).to.be.true;
				expect(children).to.have.length(1);
				const [child1] = children;
				expect(child1).to.be.instanceOf(WarningTreeItem);
				expect(child1.label).to.equal('Failed to load properties: Failed to describe collection');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.None);
			});

			test('should return list of properties', async () => {
				const driver = new MockDriver({ validCollection: true }, new MockPasswordProvider({}));
				const describeCollectionStub = sinon.stub(driver, 'describeCollection').resolves([
					{
						name: 'property-1',
						type: 'string',
						isNullable: false,
						defaultValue: null,
						isPrimaryKey: true,
					},
					{
						name: 'property-2',
						type: 'number',
						isNullable: true,
						defaultValue: null,
						isPrimaryKey: false,
					},
				]);
				const propertiesTreeItem = new PropertiesTreeItem(
					'Columns',
					new PropertiesDataManager('Collection 1', driver),
				);
				await expect(propertiesTreeItem.load()).to.be.fulfilled;
				const children = provider.getChildren(propertiesTreeItem);
				expect(describeCollectionStub.calledOnceWith('Collection 1')).to.be.true;
				expect(children).to.have.length(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(TreeItem);
				expect(child1.label).to.equal('property-1 (string)');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('key');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child2).to.be.instanceOf(TreeItem);
				expect(child2.label).to.equal('property-2 (number)');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('output');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
			});
		});
	});
});
