import { ok, strictEqual } from 'assert';
import sinon from 'sinon';
import { TreeItemCollapsibleState } from 'vscode';
import ConnectionManager from '../../../connection/connection-manager';
import ConnectionTreeProvider from '../connection-tree-provider';
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

		test('should return connection tree item', () => {
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
});
