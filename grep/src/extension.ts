'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';

function exec(command: string, options: child_process.ExecOptions): Promise<{ stdout: string; stderr: string }> {
	return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
		child_process.exec(command, options, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
			}
			resolve({ stdout, stderr });
		});
	});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.grep', async () => {
        // The code you place here will be executed every time your command is executed
        let folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            let mainFolder = folders[0];
            
            let input = await vscode.window.showInputBox();

            let { stdout } = await exec("git grep -n " + input, { cwd: mainFolder.uri.path });
            let doc = await vscode.workspace.openTextDocument({content: stdout, language: "c"});
            await vscode.window.showTextDocument(doc, { preview: false });
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}