import * as vscode from 'vscode';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ATLAS_APP_SERVICES_CONFIG_NAME } from './constants';

interface AppServicesApp {
    id: string;
    name: string;
}

interface FunctionExecutionResult {
    error_logs: string[] | null;
    logs: string[] | null;
    result: any;
    stats: {
        execution_time: string;
    }
}

export const fetchAccessToken = async (
    hostname: string,
    publicKey: string,
    privateKey: string
): Promise<string | undefined> => {
    const useLocalAuth = vscode.workspace.getConfiguration(ATLAS_APP_SERVICES_CONFIG_NAME).get<boolean>('useLocalAuth');
    let authUrl = `${hostname}/api/admin/v3.0/auth/providers/${useLocalAuth ? 'local-userpass' : 'mongodb-cloud'}/login`;

    let authOptions: AxiosRequestConfig = {
        url: authUrl,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        data: {
            username: publicKey,
            ...(useLocalAuth ? { password: privateKey} : { apiKey: privateKey })
        },
    };

    try {
        const authResponse = await axios.request(authOptions);
        return authResponse.data.access_token as string;
    } catch (err) {
        throw Error(`Error acquiring access token: ${err}`);
    }
};

export const fetchApps = async (
    accessToken: string,
    hostname: string,
    groupId: string,
): Promise<AppServicesApp[]> => {
    let executeFuntionUrl = `${hostname}/api/admin/v3.0/groups/${groupId}/apps`;
    let executeFunctionOptions: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    };
        
    try {
        const executeFunctionResponse = await axios.get(executeFuntionUrl, executeFunctionOptions);

        const appList: AppServicesApp[] = executeFunctionResponse.data.map((fetchResultEntry: { _id: string; name: string; }) => ({
            id: fetchResultEntry._id,
            name: fetchResultEntry.name
        }));
        return appList;
    } catch (err) {
        throw Error(`Error fetching apps from app services: ${err}`);
    }
};

export const executeFunctionAgainstServer = async (
    accessToken: string,
    hostname: string,
    groupId: string,
    appId: string,
    functionSource: string,
    executionSource: string
): Promise<FunctionExecutionResult> => {
    let executeFuntionUrl = `${hostname}/api/admin/v3.0/groups/${groupId}/apps/${appId}/debug/execute_function_source?run_as_system=true&user_id=`;
    let executeFunctionOptions: AxiosRequestConfig = {
        url: executeFuntionUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        data: {
            source: functionSource,
            eval_source: executionSource,
        },
    };
        
    try {
        const executeFunctionResponse = await axios.request<FunctionExecutionResult>(executeFunctionOptions);
        return executeFunctionResponse.data;
    } catch (err) {
        const castErr = err as AxiosError<{error: string}>;
        throw Error(`Error executing function against app services: ${castErr?.response?.data?.error}`);
    }
};
