import * as vscode from 'vscode';

import { ATLAS_APP_SERVICES_CONFIG_NAME, DEFAULT_RUNNER } from './constants';

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
		const baseHostname = atlasAppServicesConfig.get<string>('hostname');

		if (!publicApiKey || !privateApiKey || !baseHostname) {
			vscode.window.showInformationMessage('Public and Private API keys must be added to the config before using');
			return;
		}

		let document = editor.document;

		// Get the document text
		const documentText = document.getText();

		// Make web request to the baas admin api to run the funciton
		const runAsSystem = true; // eventually collect through `quickPick`

		try {
			// acquire an access token
			const authType = baseHostname.includes('local') ? 'local-userpass' : 'mongodb-cloud';
			let authUrl = `${baseHostname}/api/admin/v3.0/auth/providers/${authType}/login`;

			let authOptions: RequestInit = {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					username: publicApiKey,
					...(authType === 'local-userpass' ? { password: privateApiKey} : { apiKey: privateApiKey })
				}),
			};
				
			const authFetchResponse = await fetch(authUrl, authOptions);
			const authResult = await authFetchResponse.json();

			const accessToken: string = authResult.access_token;


			// Run the function against baas
			const source = documentText;
			const evalSource = DEFAULT_RUNNER; // how do we want to let people manage this?
			const groupId = '626ae022db021237a26b7473';
			const appId = '6271495c366de7b720498c16';

			let executeFuntionUrl = `${baseHostname}/api/admin/v3.0/groups/${groupId}/apps/${appId}/debug/execute_function_source?run_as_system=${runAsSystem}&user_id=`;

			let executeFunctionOptions: RequestInit = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					source,
					eval_source: evalSource,
				}),
			};
				
			const executeFunctoinFetchResponse = await fetch(executeFuntionUrl, executeFunctionOptions);
			const executeFunctionResult = await executeFunctoinFetchResponse.json();

			console.log('Execute Function Result: ', executeFunctionResult);

		} catch (err) {
			console.error('Error acquiring access token: ', err);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
