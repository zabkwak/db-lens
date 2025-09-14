import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { TreeItemCollapsibleState } from 'vscode';
import Connection from '../../../connection/connection';
import ConnectionGroup from '../../../connection/connection-group';
import ConnectionManager from '../../../connection/connection-manager';
import BaseDriver from '../../../drivers/base';
import { ICollectionPropertyDescription, IQueryResult, IViewsDriver } from '../../../drivers/interfaces';
import BasePasswordProvider from '../../../password-providers/base';
import Password from '../../../password-providers/password';
import ConnectionTreeProvider from '../connection-tree-provider';
import CollectionsDataManager from '../data-managers/collections.data-manager';
import PropertiesDataManager from '../data-managers/properties.data-manager';
import ViewsDataManager from '../data-managers/views.data-manager';
import CollectionTreeItem from '../tree-items/collection.tree-item';
import CollectionsTreeItem from '../tree-items/collections.tree-item';
import ConnectionGroupTreeItem from '../tree-items/connection-group.tree-item';
import ConnectionTreeItem from '../tree-items/connection.tree-item';
import DataTreeItem from '../tree-items/data.tree-item';
import NamespaceTreeItem from '../tree-items/namespace.tree-item';
import PropertiesTreeItem from '../tree-items/properties.tree-item';
import TreeItem from '../tree-items/tree-item';
import ViewsTreeItem from '../tree-items/views.tree-item';

// TODO maybe move this to unit tests entirely? it doesn't need to vscode api .. or maybe use it as full scale integration test with the composed docker service

// TODO figure out how to set this up globally for extension tests
chai.use(chaiAsPromised);

describe('ConnectionTreeProvider', () => {
	let provider: ConnectionTreeProvider = new ConnectionTreeProvider();
	let getConnectionsStub: sinon.SinonStub;

	beforeEach(() => {
		provider = new ConnectionTreeProvider();
		getConnectionsStub = sinon.stub(ConnectionManager, 'getConnections');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('.getChildren', () => {
		describe('Root', () => {
			it('should return loading tree item', () => {
				const loadStub = sinon.stub(ConnectionManager, 'load');
				loadStub.resolves();
				getConnectionsStub.returns(null);
				const children = provider.getChildren();
				expect(loadStub.called).to.be.true;
				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Loading...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return warning tree item when no connections found', () => {
				const loadStub = sinon.stub(ConnectionManager, 'load');
				getConnectionsStub.returns([]);
				const children = provider.getChildren();
				expect(loadStub.notCalled).to.be.true;
				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('No connections found');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return connection tree items', () => {
				getConnectionsStub.returns([
					new Connection({
						name: 'Connection 1',
						db: {
							driver: 'postgres',
							credentials: {
								host: 'localhost',
								port: 5432,
								username: 'user',
								database: 'db',
							},
						},
						passwordProvider: {
							type: 'prompt',
							config: {},
						},
					}),
					new Connection({
						name: 'Connection 2',
						db: {
							driver: 'postgres',
							credentials: {
								host: 'localhost',
								port: 5432,
								username: 'user',
								database: 'db',
							},
						},
						passwordProvider: {
							type: 'prompt',
							config: {},
						},
					}),
					new ConnectionGroup({
						name: 'Group 1',
						connections: [
							{
								name: 'Connection 3',
								db: {
									driver: 'postgres',
									credentials: {
										host: 'localhost',
										port: 5432,
										username: 'user',
										database: 'db',
									},
								},
								passwordProvider: {
									type: 'prompt',
									config: {},
								},
							},
						],
					}),
				]);
				const children = provider.getChildren();
				expect(children).to.have.lengthOf(3);
				const [child1, child2, child3] = children;
				expect(child1).to.be.instanceOf(ConnectionTreeItem);
				expect(child1.label).to.equal('Connection 1');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(child1.iconPath).to.not.be.undefined;
				expect(child1.iconPath).to.have.property('id', 'database');
				expect(child1.iconPath).to.have.property('color', undefined);
				expect(child1.getParent()).to.be.null;
				expect(child2).to.be.instanceOf(ConnectionTreeItem);
				expect(child2.label).to.equal('Connection 2');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(child2.iconPath).to.not.be.undefined;
				expect(child2.iconPath).to.have.property('id', 'database');
				expect(child2.iconPath).to.have.property('color', undefined);
				expect(child2.getParent()).to.be.null;
				expect(child3).to.be.instanceOf(ConnectionGroupTreeItem);
				expect(child3.label).to.equal('Group 1');
				expect(child3.collapsibleState).to.equal(TreeItemCollapsibleState.Expanded);
				expect(child3.iconPath).to.not.be.undefined;
				expect(child3.iconPath).to.have.property('id', 'layers');
				expect(child3.iconPath).to.have.property('color', undefined);
				expect(child3.getParent()).to.be.null;
			});
		});

		describe('ConnectionGroupTreeItem', () => {
			beforeEach(() => {
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

			it('should return connection tree items', () => {
				const children = provider.getChildren(
					new ConnectionGroupTreeItem(
						new ConnectionGroup({
							name: 'Group 1',
							connections: [
								{
									name: 'Connection 3',
									db: {
										driver: 'postgres',
										credentials: {
											host: 'localhost',
											port: 5432,
											username: 'user',
											database: 'db',
										},
									},
									passwordProvider: {
										type: 'prompt',
										config: {},
									},
								},
							],
						}),
						null,
					),
				);
				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(ConnectionTreeItem);
				expect(child.label).to.equal('Connection 3');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(child.iconPath).to.not.be.undefined;
				expect(child.iconPath).to.have.property('id', 'database');
				expect(child.iconPath).to.have.property('color', undefined);
				expect(child.getParent()).to.be.an.instanceOf(ConnectionGroupTreeItem);
			});
		});

		describe('ConnectionTreeItem', () => {
			beforeEach(() => {
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

			it('should return warning tree item when connection failed', () => {
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
				const loadCollectionsStub = sinon.stub(mockConnection, 'getCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection, null));

				expect(connectStub.notCalled).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Connection failed: Connection 1');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return loading tree item when connection is connecting', () => {
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
				const loadCollectionsStub = sinon.stub(mockConnection, 'getCollections');

				const children = provider.getChildren(new ConnectionTreeItem(mockConnection, null));

				expect(connectStub.calledOnce).to.be.true;
				expect(loadCollectionsStub.notCalled).to.be.true;

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Connecting...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return list of namespace tree items', async () => {
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
					isConnected() {
						return true;
					},
					isConnecting() {
						return false;
					},
					getDriver() {
						return {
							async getNamespaces() {
								return ['public', 'test'];
							},
						};
					},
					async connect() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);

				const connectionTreeItem = new ConnectionTreeItem(mockConnection, null);

				await expect(connectionTreeItem.connect()).to.be.fulfilled;

				const children = provider.getChildren(connectionTreeItem);
				expect(children).to.have.lengthOf(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(NamespaceTreeItem);
				expect(child1.label).to.equal('public');
				expect(child1.getParent()).to.be.instanceOf(ConnectionTreeItem);
				expect(child1.iconPath).to.have.property('id', 'database');
				expect(child1.iconPath).to.have.property('color', undefined);
				expect(child2).to.be.instanceOf(NamespaceTreeItem);
				expect(child2.label).to.equal('test');
				expect(child2.getParent()).to.be.instanceOf(ConnectionTreeItem);
				expect(child2.iconPath).to.have.property('id', 'database');
				expect(child2.iconPath).to.have.property('color', undefined);
			});
		});

		describe('NamespaceTreeItem', () => {
			it('should return data tree item for tables', () => {
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
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const getCollectionsStub = sinon.stub(mockConnection, 'getCollections');

				const children = provider.getChildren(new NamespaceTreeItem('public', null, mockConnection));

				expect(connectStub).to.have.property('calledOnce', false);
				expect(getCollectionsStub).to.have.property('notCalled', true);

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(DataTreeItem);
				expect(child).to.be.an.instanceOf(CollectionsTreeItem);
				expect(child.label).to.equal('Tables');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(child.iconPath).to.have.property('id', 'folder');
				expect(child.iconPath).to.have.property('color', undefined);
				expect(child.getParent()).to.be.an.instanceOf(NamespaceTreeItem);
			});

			it('should return data tree item for tables and views', () => {
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
					isConnected() {
						return true;
					},
					isConnecting() {
						return false;
					},
					getDriver() {
						return {
							async getViews() {
								return [];
							},
						};
					},
					async connect() {},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const getCollectionsStub = sinon.stub(mockConnection, 'getCollections');

				const children = provider.getChildren(new NamespaceTreeItem('public', null, mockConnection));

				expect(connectStub).to.have.property('calledOnce', false);
				expect(getCollectionsStub).to.have.property('notCalled', true);

				expect(children).to.have.lengthOf(2);
				const [tables, views] = children;
				expect(tables).to.be.instanceOf(DataTreeItem);
				expect(tables).to.be.an.instanceOf(CollectionsTreeItem);
				expect(tables.label).to.equal('Tables');
				expect(tables.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(tables.iconPath).to.have.property('id', 'folder');
				expect(tables.iconPath).to.have.property('color', undefined);
				expect(tables.getParent()).to.be.an.instanceOf(NamespaceTreeItem);
				expect(views).to.be.instanceOf(DataTreeItem);
				expect(views).to.be.an.instanceOf(ViewsTreeItem);
				expect(views.label).to.equal('Views');
				expect(views.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				expect(views.iconPath).to.have.property('id', 'preview');
				expect(views.iconPath).to.have.property('color', undefined);
				expect(views.getParent()).to.be.an.instanceOf(NamespaceTreeItem);
			});
		});

		describe('CollectionsTreeItem', () => {
			beforeEach(() => {
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

			it('should return loading tree item when collections are loading', () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					failed() {
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
					async getCollections() {
						return null;
					},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const getCollectionsStub = sinon.stub(mockConnection, 'getCollections');

				const children = provider.getChildren(
					new CollectionsTreeItem(
						'Tables',
						null,
						mockConnection.getDriver(),
						new CollectionsDataManager(mockConnection, 'namespace'),
						'namespace',
					),
				);

				expect(connectStub).to.have.property('notCalled', true);
				expect(getCollectionsStub).to.have.property('calledOnce', true);

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Loading collections...');
				expect(child.getParent()).to.be.null;
			});

			it('should return warning tree item when connection has no collections', async () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
					},
					failed() {
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
					async getCollections(namespace: string): Promise<string[]> {
						return [];
					},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const getCollectionsStub = sinon.stub(mockConnection, 'getCollections').resolves([]);

				const collectionsTreeItem = new CollectionsTreeItem(
					'Tables',
					null,
					mockConnection.getDriver(),
					new CollectionsDataManager(mockConnection, 'namespace'),
					'namespace',
				);
				await expect(collectionsTreeItem.load()).to.be.fulfilled;

				const children = provider.getChildren(collectionsTreeItem);
				expect(connectStub).to.have.property('notCalled', true);
				expect(getCollectionsStub).to.have.property('calledOnce', true);

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('No collections found');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return collection tree item when connection has collections', async () => {
				const mockConnection = {
					getName() {
						return 'Connection 1';
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
					async getCollections() {
						return ['Collection 1', 'Collection 2'];
					},
				} as unknown as Connection<any, any>;
				getConnectionsStub.returns([mockConnection]);
				const connectStub = sinon.stub(mockConnection, 'connect');
				const getCollectionsStub = sinon
					.stub(mockConnection, 'getCollections')
					.resolves(['Collection 1', 'Collection 2']);
				const collectionsTreeItem = new CollectionsTreeItem(
					'Tables',
					null,
					mockConnection.getDriver(),
					new CollectionsDataManager(mockConnection, 'namespace'),
					'namespace',
				);
				await expect(collectionsTreeItem.load()).to.be.fulfilled;

				const children = provider.getChildren(collectionsTreeItem);

				expect(connectStub).to.have.property('notCalled', true);
				expect(getCollectionsStub).to.have.property('calledOnce', true);

				expect(children).to.have.lengthOf(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(CollectionTreeItem);
				expect(child1.label).to.equal('Collection 1');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('folder');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child1.getParent()).to.be.an.instanceOf(CollectionsTreeItem);
				expect(child2).to.be.instanceOf(CollectionTreeItem);
				expect(child2.label).to.equal('Collection 2');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.Collapsed);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('folder');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
				expect(child2.getParent()).to.be.an.instanceOf(CollectionsTreeItem);
			});
		});

		describe('ViewsTreeItem', () => {
			class MockDriver extends BaseDriver<{ hasViews?: boolean }, {}> implements IViewsDriver {
				public getNamespaces(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public getCollections(namespace: string): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public describeCollection(
					namespace: string,
					collectionName: string,
				): Promise<ICollectionPropertyDescription[]> {
					throw new Error('Method not implemented.');
				}
				public async getViews(namespace: string): Promise<string[]> {
					if (this._credentials.hasViews) {
						return ['View 1', 'View 2'];
					}
					return [];
				}
				public getName(): string {
					return 'Mock SQL';
				}
				public getTag(): string {
					return 'mocksql';
				}
				protected _connect(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _close(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _query<T>(query: string): Promise<IQueryResult<T>> {
					throw new Error('Method not implemented.');
				}
			}
			class MockPasswordProvider extends BasePasswordProvider<{}> {
				public getPassword(): Promise<Password> {
					throw new Error('Method not implemented.');
				}
			}

			beforeEach(() => {
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

			it('should return loading tree item when views are loading', () => {
				const driver = new MockDriver({}, new MockPasswordProvider({}));

				const children = provider.getChildren(
					new ViewsTreeItem('Tables', null, new ViewsDataManager(driver, 'namespace')),
				);

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Loading views...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return warning tree item when connection has no views', async () => {
				const driver = new MockDriver({}, new MockPasswordProvider({}));
				const viewsTreeItem = new ViewsTreeItem('Tables', null, new ViewsDataManager(driver, 'namespace'));

				await expect(viewsTreeItem.load()).to.be.fulfilled;

				const children = provider.getChildren(viewsTreeItem);

				expect(children).to.have.lengthOf(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('No views found');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return collection tree item when connection has collections', async () => {
				const driver = new MockDriver({ hasViews: true }, new MockPasswordProvider({}));
				const viewsTreeItem = new ViewsTreeItem('Tables', null, new ViewsDataManager(driver, 'namespace'));

				await expect(viewsTreeItem.load()).to.be.fulfilled;

				const children = provider.getChildren(viewsTreeItem);

				expect(children).to.have.lengthOf(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(TreeItem);
				expect(child1.label).to.equal('View 1');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('preview');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child1.getParent()).to.be.an.instanceOf(ViewsTreeItem);
				expect(child2).to.be.instanceOf(TreeItem);
				expect(child2.label).to.equal('View 2');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('preview');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
				expect(child2.getParent()).to.be.an.instanceOf(ViewsTreeItem);
			});
		});

		describe('CollectionTreeItem', () => {
			class MockDriver extends BaseDriver<{}, {}> {
				public getNamespaces(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public getCollections(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public describeCollection(collectionName: string): Promise<ICollectionPropertyDescription[]> {
					throw new Error('Method not implemented.');
				}
				public getName(): string {
					return 'Mock SQL';
				}
				public getTag(): string {
					return 'mocksql';
				}
				protected _connect(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _close(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _query<T>(query: string): Promise<IQueryResult<T>> {
					throw new Error('Method not implemented.');
				}
			}
			class MockPasswordProvider extends BasePasswordProvider<{}> {
				public getPassword(): Promise<Password> {
					throw new Error('Method not implemented.');
				}
			}

			beforeEach(() => {
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

			it('should return list of Collection children for SQL collection', () => {
				const children = provider.getChildren(
					new CollectionTreeItem(
						'Collection 1',
						null,
						new MockDriver({}, new MockPasswordProvider({})),
						'namespace',
					),
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
				expect(propertiesItem.getParent()).to.be.an.instanceOf(CollectionTreeItem);
			});
		});

		describe('PropertiesTreeItem', () => {
			class MockDriver extends BaseDriver<{ validCollection?: boolean }, {}> {
				public getNamespaces(): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public getCollections(namespace: string): Promise<string[]> {
					throw new Error('Method not implemented.');
				}
				public describeCollection(
					namespace: string,
					collectionName: string,
				): Promise<ICollectionPropertyDescription[]> {
					throw new Error('Method not implemented.');
				}
				public getName(): string {
					return 'Mock SQL';
				}
				public getTag(): string {
					return 'mocksql';
				}
				protected _connect(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _close(): Promise<void> {
					throw new Error('Method not implemented.');
				}
				protected _query<T>(query: string): Promise<IQueryResult<T>> {
					throw new Error('Method not implemented.');
				}
			}
			class MockPasswordProvider extends BasePasswordProvider<{}> {
				public getPassword(): Promise<Password> {
					throw new Error('Method not implemented.');
				}
			}
			beforeEach(() => {
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

			it('should return loading tree item', () => {
				const driver = new MockDriver({}, new MockPasswordProvider({}));
				const describeCollectionStub = sinon.stub(driver, 'describeCollection');
				const children = provider.getChildren(
					new PropertiesTreeItem(
						'Columns',
						null,
						new PropertiesDataManager(driver, 'namespace', 'Collection 1'),
					),
				);
				expect(describeCollectionStub.calledOnceWith('namespace', 'Collection 1')).to.be.true;
				expect(children).to.have.length(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Loading properties...');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return warning tree item', async () => {
				const driver = new MockDriver({ validCollection: false }, new MockPasswordProvider({}));
				const describeCollectionStub = sinon
					.stub(driver, 'describeCollection')
					.throws(new Error('Failed to describe collection'));
				const propertiesTreeItem = new PropertiesTreeItem(
					'Columns',
					null,
					new PropertiesDataManager(driver, 'namespace', 'Collection 1'),
				);
				await expect(propertiesTreeItem.load()).to.be.rejectedWith('Failed to describe collection');
				const children = provider.getChildren(propertiesTreeItem);
				expect(describeCollectionStub.calledOnceWith('namespace', 'Collection 1')).to.be.true;
				expect(children).to.have.length(1);
				const [child] = children;
				expect(child).to.be.instanceOf(TreeItem);
				expect(child.label).to.equal('Failed to load properties: Failed to describe collection');
				expect(child.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				expect(child.getParent()).to.be.null;
			});

			it('should return list of properties', async () => {
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
					null,
					new PropertiesDataManager(driver, 'namespace', 'Collection 1'),
				);
				await expect(propertiesTreeItem.load()).to.be.fulfilled;
				const children = provider.getChildren(propertiesTreeItem);
				expect(describeCollectionStub.calledOnceWith('namespace', 'Collection 1')).to.be.true;
				expect(children).to.have.length(2);
				const [child1, child2] = children;
				expect(child1).to.be.instanceOf(TreeItem);
				expect(child1.label).to.equal('property-1 (string)');
				expect(child1.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child1.iconPath.id).to.equal('key');
				// @ts-expect-error
				expect(child1.iconPath.color).to.be.undefined;
				expect(child1.getParent()).to.be.an.instanceOf(PropertiesTreeItem);
				expect(child2).to.be.instanceOf(TreeItem);
				expect(child2.label).to.equal('property-2 (number)');
				expect(child2.collapsibleState).to.equal(TreeItemCollapsibleState.None);
				// @ts-expect-error
				expect(child2.iconPath.id).to.equal('output');
				// @ts-expect-error
				expect(child2.iconPath.color).to.be.undefined;
				expect(child2.getParent()).to.be.an.instanceOf(PropertiesTreeItem);
			});
		});
	});
});
