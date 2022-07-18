import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('"atlas-app-services-functions" is now active in the web extension host!');

	// Runs the function in the current editor against the baas server
	let disposable = vscode.commands.registerCommand('atlas-app-services-functions.runFunction', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello from VSCode!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
