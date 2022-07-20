import * as vscode from 'vscode';
import { fetchUserGroups } from './atlas-requests';
import { BaasFunctionsProvider } from './baas-function-provider';
import { executeFunctionAgainstServer, fetchAccessToken, fetchApps, fetchFunctionDetails } from './baas-requests';

import { ATLAS_APP_SERVICES_CONFIG_NAME } from './constants';
import { getIdFromQuickPick } from './user-quickpicks';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const atlasAppServicesConfig = vscode.workspace.getConfiguration(ATLAS_APP_SERVICES_CONFIG_NAME);
	const publicApiKey = atlasAppServicesConfig.get<string>('publicApiKey');
	const privateApiKey = atlasAppServicesConfig.get<string>('privateApiKey');
	const appServicesHostname = atlasAppServicesConfig.get<string>('appServicesHostname');
	const atlasHostname = atlasAppServicesConfig.get<string>('atlasHostname');

	if (!publicApiKey || !privateApiKey || !appServicesHostname || !atlasHostname) {
		vscode.window.showInformationMessage('Public and Private API keys must be added to the config before using');
		return;
	}

	const baasFunctionTreeProvider = new BaasFunctionsProvider(
		appServicesHostname,
		atlasHostname,
		publicApiKey,
		privateApiKey,
	);

	vscode.window.registerTreeDataProvider('functions', baasFunctionTreeProvider);

	// Runs the function in the current editor against the baas server
	context.subscriptions.push(vscode.commands.registerCommand('atlas-app-services-functions.runFunction', async () => {
		// Get the active text editor
        const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showInformationMessage('You must have an open editor to run as a function');
			return;
		}
		
		const executeSource = atlasAppServicesConfig.get<string>('functionExecution');
		if (!executeSource) {
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
				executeSource
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
	}));


	context.subscriptions.push(vscode.commands.registerCommand('atlas-app-services-functions.loadFunctionIntoEditor', async (
		groupId: string,
		appId: string,
		functionId: string
	) => {
		const accessToken = await fetchAccessToken(
			appServicesHostname,
			publicApiKey,
			privateApiKey,
		);

		if (!accessToken) { return; }

		const functionDetails = await fetchFunctionDetails(
			accessToken,
			appServicesHostname,
			groupId,
			appId,
			functionId,
		);

		if (!functionDetails?.source) { return; }

		const sourceDoc = await vscode.workspace.openTextDocument();
		const editor = await vscode.window.showTextDocument(sourceDoc);
		editor.edit((editBuilder) => {
			editBuilder.insert(new vscode.Position(0 ,0), functionDetails.source!);
		});
	}));
}

export function deactivate() {}