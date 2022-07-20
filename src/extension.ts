import * as vscode from 'vscode';
import { fetchUserGroups } from './atlas-requests';
import { executeFunctionAgainstServer, fetchAccessToken, fetchApps } from './baas-requests';

import { ATLAS_APP_SERVICES_CONFIG_NAME, DEFAULT_RUNNER } from './constants';
import { getIdFromQuickPick } from './user-quickpicks';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('"atlas-app-services-functions" is now active in the web extension host!');

	// Runs the function in the current editor against the baas server
	let disposable = vscode.commands.registerCommand('atlas-app-services-functions.runFunction', async () => {
		// Get the active text editor
        const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showInformationMessage('You must have an open editor to run as a function');
			return;
		}

		const atlasAppServicesConfig = vscode.workspace.getConfiguration(ATLAS_APP_SERVICES_CONFIG_NAME);
		const publicApiKey = atlasAppServicesConfig.get<string>('publicApiKey');
		const privateApiKey = atlasAppServicesConfig.get<string>('privateApiKey');
		const appServicesHostname = atlasAppServicesConfig.get<string>('appServicesHostname');
		const atlasHostname = atlasAppServicesConfig.get<string>('atlasHostname');

		if (!publicApiKey || !privateApiKey || !appServicesHostname || !atlasHostname) {
			vscode.window.showInformationMessage('Public and Private API keys must be added to the config before using');
			return;
		}

		const logsChannel = vscode.window.createOutputChannel('Atlas App Services: Logs');
		const returnChannel = vscode.window.createOutputChannel('Atlas App Services: Return');
		returnChannel.show(true);

		try {
			const userGroups = await fetchUserGroups(
				atlasHostname,
				publicApiKey,
				privateApiKey
			);

			const groupId = await getIdFromQuickPick(userGroups, 'Select the project where the app is defined');

			if (!groupId) { return; }

			const accessToken = await fetchAccessToken(appServicesHostname, publicApiKey, privateApiKey);

			if (!accessToken) {
				throw Error("unable to acquire access token");
			}

			const availableApps = await fetchApps(
				accessToken,
				appServicesHostname,
				groupId
			);

			const appId = await getIdFromQuickPick(availableApps, 'Select the app to run the function in');
			
			if (!appId) { return; }

			// Run the function against baas
			const documentText = editor.document.getText();
			const executeFunctionResult = await executeFunctionAgainstServer(
				accessToken,
				appServicesHostname,
				groupId,
				appId,
				documentText,
				DEFAULT_RUNNER
			);

			if (executeFunctionResult.logs?.length) {
				executeFunctionResult.logs.forEach((log) => {
					logsChannel.appendLine(log);
				});
			}

			returnChannel.appendLine(executeFunctionResult.result);
		} catch (err) {
			const castErr = err as Error;
			returnChannel.appendLine(castErr.message);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
