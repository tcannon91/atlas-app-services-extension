import * as vscode from 'vscode';
import { fetchUserGroups } from './atlas-requests';
import { fetchAccessToken, fetchApps, fetchFunctions } from './baas-requests';

export class BaasFunctionsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(
        private readonly appServicesHostname: string,
        private readonly atlasHostname: string,
        private readonly publicApiKey: string,
        private readonly privateApiKey: string,
    ) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		if (element) {
            switch (element.contextValue) {
                case 'project': {
                    const castElement = element as Project;
                    const accessToken = await fetchAccessToken(
                        this.appServicesHostname,
                        this.publicApiKey,
                        this.privateApiKey
                    );

                    if (!accessToken) {
                        return Promise.resolve([]);
                    }

                    const availableApps = await fetchApps(
                        accessToken,
                        this.appServicesHostname,
                        castElement.id,
                    ); 

                    return Promise.resolve(availableApps.map((app) => new App(
                        app.name,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        app.id,
                        castElement.id
                    )));
                }

                case 'app': {
                    const castElement = element as App;
                    const accessToken = await fetchAccessToken(
                        this.appServicesHostname,
                        this.publicApiKey,
                        this.privateApiKey
                    );

                    if (!accessToken) {
                        return Promise.resolve([]);
                    }

                    const availableFunctions = await fetchFunctions(
                        accessToken,
                        this.appServicesHostname,
                        castElement.groupId,
                        castElement.id,
                    ); 

                    return Promise.resolve(availableFunctions.map((func) => new Function(
                        func.name,
                        vscode.TreeItemCollapsibleState.None,
                        func.id,
                        {
                            command: 'atlas-app-services-functions.loadFunctionIntoEditor',
                            arguments: [castElement.groupId, castElement.id, func.id],
                            title: '',
                        },
                    )));
                }

                default:
                    return Promise.resolve([]);
            }
		} else {
            const userGroups = await fetchUserGroups(
                this.atlasHostname,
                this.publicApiKey,
                this.privateApiKey
            );

            return Promise.resolve(userGroups.map((userGroup) => new Project(
                userGroup.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                userGroup.id
            )));
		}
	}

}

export class Project extends vscode.TreeItem {
    constructor(
        public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
    ) {
        super(label, collapsibleState);
    }
    contextValue = 'project';
}

export class App extends vscode.TreeItem {
    constructor(
        public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
        public readonly groupId: string,
    ) {
        super(label, collapsibleState);
    }
    contextValue = 'app';
}

export class Function extends vscode.TreeItem {
    constructor(
        public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }

    contextValue = 'function';
}