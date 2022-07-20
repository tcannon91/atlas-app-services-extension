import * as vscode from 'vscode';
import type { AtlasGroup } from './atlas-requests';

interface QuickPickItem {
    id: string;
    name: string;
}

export const getIdFromQuickPick = async (items: QuickPickItem[], placeHolderText?: string): Promise<string | undefined> => {
    const selectedName = await vscode.window.showQuickPick(items.map((item) => item.name), {
        placeHolder: placeHolderText,
    });

    const item = items.find((item) => item.name === selectedName);

    return item?.id;
};