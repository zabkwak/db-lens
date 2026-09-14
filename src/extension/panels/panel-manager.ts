import BasePanel from './base.panel';

export default class PanelManager {
	private static _instance: PanelManager;
	private readonly _registeredPanels = new Map<string, BasePanel>();

	private constructor() {
		// Private constructor to enforce Singleton pattern
	}

	public static getInstance(): PanelManager {
		if (!PanelManager._instance) {
			PanelManager._instance = new PanelManager();
		}
		return PanelManager._instance;
	}

	public registerPanel(panel: BasePanel): void {
		this._registeredPanels.set(panel.id, panel);
	}

	public unregisterPanel(panel: BasePanel): void {
		this._registeredPanels.delete(panel.id);
	}

	public getPanel(id: string): BasePanel | undefined {
		return this._registeredPanels.get(id);
	}

	public getAllPanels(): BasePanel[] {
		return Array.from(this._registeredPanels.values());
	}
}
