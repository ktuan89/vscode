'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "utilities" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let gotoSameWordDisposable = vscode.commands.registerCommand('extension.gotoSameWord', (args: any) => {
        const reverse: boolean = args["reverse"];

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        if (editor) {
            const selection = editor.selection;
            const wordRange = editor.document.getWordRangeAtPosition(selection.active);
            const word = editor.document.getText(wordRange);
            function* positionGenerator() {
                if (!editor) {
                    return;
                }
                for (let row = selection.active.line; row < editor.document.lineCount; row++) {
                    const start = (row === selection.active.line) ? selection.active.character + 1 : 0;
                    const text = editor.document.lineAt(row).text;
                    for (let col = start; col + word.length < text.length; ++col) { 
                        yield [row, col];
                    }
                }
                for (let row = 0; row <= selection.active.line; row++) {
                    const text = editor.document.lineAt(row).text;
                    const end = (row === selection.active.line) ? selection.active.character : text.length;
                    for (let col = 0; col < end && col < text.length; col++) {
                        yield [row, col];
                    }
                }
            }
            function* positionReverseGenerator() {
                if (!editor) {
                    return;
                }
                for (let row = selection.active.line; row >= 0; row--) {
                    const text = editor.document.lineAt(row).text;
                    const start = (row === selection.active.line) ? selection.active.character - 1 : text.length - 1;
                    for (let col = start; col > 0; col--) { 
                        yield [row, col];
                    }
                }
                for (let row = editor.document.lineCount - 1; row >= selection.active.line; row--) {
                    const text = editor.document.lineAt(row).text;
                    const end = (row === selection.active.line) ? selection.active.character + 1 : 0;
                    for (let col = text.length - 1; col >= 0 && col >= end; col--) {
                        yield [row, col];
                    }
                }
            }
            let generator = reverse ? positionReverseGenerator : positionGenerator;
            let foundPosition = null;
            for (let pp of generator()) {
                const [row, col] = pp;
                const text = editor.document.lineAt(row).text;
                if (text.substr(col, word.length) === word) {
                    foundPosition = new vscode.Position(row, col);
                    break;
                }
            }
            if (foundPosition) {
                editor.selection = new vscode.Selection(foundPosition, foundPosition);
                editor.revealRange(editor.selection);
                return;
            }
        }
    });

    let openFileAtCursorDisposable = vscode.commands.registerCommand('extension.openFileAtCursor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const line = selection.active.line;
            const text = editor.document.lineAt(line).text;
            const re = /((\/|\w|_|\.|-)+)(:(\d+))?(:(\d+))?/;
            {
                const res = text.match(re);
                if (res && vscode.workspace.workspaceFolders) {
                    const partialPath = res[1];
                    const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    const fullpath = path.join(folder, partialPath);
                    if (fs.existsSync(fullpath)) {
                        const doc = await vscode.workspace.openTextDocument(fullpath);
                        let pos = null;
                        if (res[4]) {
                            const row = parseInt(res[4]) - 1;
                            let col = 0;
                            if (res[6]) {
                                col = parseInt(res[6]) - 1;
                            }
                            pos = new vscode.Position(row, col);
                        }
                        if (pos) {
                            await vscode.window.showTextDocument(doc, {selection: new vscode.Range(pos, pos)});
                        } else {
                            await vscode.window.showTextDocument(doc);
                        }
                    }
                }
            }
        }
    });
    
    let copyCurrentWordDisposable = vscode.commands.registerCommand('extension.copyCurrentWord', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const wordRange = editor.document.getWordRangeAtPosition(selection.active);
            const text = editor.document.getText(wordRange);
            await vscode.env.clipboard.writeText(text);
        }
    });

    let filterLinesDisposable = vscode.commands.registerCommand('extension.filterLines', async () => {
        let input = await vscode.window.showInputBox();
        if (input) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                let filterOut = false;
                let matchStr =  input;
                if (input.startsWith("-")) {
                    filterOut = true;
                }
                if (input.startsWith("-") || input.startsWith("+")) {
                    matchStr = input.slice(1);
                }
                editor.edit(editBuilder => {
                    for (let row = 0; row < editor.document.lineCount; row++) {
                        const textLine = editor.document.lineAt(row);
                        // console.log(textLine.range.end.line + " " + textLine.range.end.character + " " + textLine.rangeIncludingLineBreak.end.line + " " + textLine.rangeIncludingLineBreak.end.character);
                        const isMatching = textLine.text.indexOf(matchStr) >= 0;
                        if ((isMatching && filterOut) || (!isMatching && !filterOut)) {
                            editBuilder.delete(new vscode.Range(new vscode.Position(row, 0), new vscode.Position(row + 1, 0)));
                        }
                    }
                });
            }
        }
    });

    context.subscriptions.push(gotoSameWordDisposable);
    context.subscriptions.push(openFileAtCursorDisposable);
    context.subscriptions.push(copyCurrentWordDisposable);
    context.subscriptions.push(filterLinesDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}