import AxiosDigestAuth from '@mhoc/axios-digest-auth';
import { AxiosResponse } from 'axios';

export interface AtlasGroup {
    name: string;
    id: string;
}

export const fetchUserGroups = async (
    hostname: string,
    publicApiKey: string,
    privateApiKey: string,
): Promise<AtlasGroup[]> => {
    const digestAuth = new AxiosDigestAuth({
        username: publicApiKey,
        password: privateApiKey
    });

    const url = `${hostname}/api/public/v1.0/groups`;

    try {
        const digestAuthResponse = await digestAuth.request({
            method: 'GET',
            url,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // I know it is naughty but just need to force it to do what I want
        const castResults = digestAuthResponse.data as { results: any[]; links: any[]; totalCount: number };
        const atlasGroups: AtlasGroup[] = castResults.results.map((fetchResultEntry) => ({
            id: fetchResultEntry.id,
            name: fetchResultEntry.name
        }));

        return atlasGroups;
    } catch (err) {
        throw Error(`Error fetching user groups from atlas: ${err}`);
    }
};
