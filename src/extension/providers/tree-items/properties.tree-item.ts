import * as vscode from 'vscode';
import { ICollectionPropertyDescription } from '../../../drivers/base';
import DataTreeItem from './data.tree-item';

export default class PropertiesTreeItem extends DataTreeItem<ICollectionPropertyDescription> {
	protected _getIcon(): vscode.ThemeIcon | undefined {
		return new vscode.ThemeIcon('symbol-property');
	}
}
