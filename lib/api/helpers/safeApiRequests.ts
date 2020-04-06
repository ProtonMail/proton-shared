import { serverTime } from 'pmcrypto';
import { API_SAFE_REQUESTS } from '../../constants';
import { wait } from '../../helpers/promise';

export async function processApiRequestsSafe<T>(
    requests: (() => Promise<T>)[],
    apiCallsPerRequest = 1,
    maxConcurrent?: number
): Promise<T[]> {
    const mutableRequests = [...requests];
    const maxProcessing = Math.floor(API_SAFE_REQUESTS.MAX / apiCallsPerRequest);

    const results: T[] = [];
    const resolvedTimes: number[] = [];

    const runNextRequest = (): Promise<any> => {
        const executor = mutableRequests.shift();
        if (executor) {
            return executor().then((result) => {
                const totalResolved = resolvedTimes.push(+serverTime());
                const sortedResolvedTimes = [...resolvedTimes].sort();
                results.push(result);
                const elapsedTime =
                    totalResolved >= maxProcessing
                        ? +serverTime() - sortedResolvedTimes[totalResolved - maxProcessing]
                        : Infinity;
                if (elapsedTime < API_SAFE_REQUESTS.INTERVAL_MILLISECONDS) {
                    return wait(API_SAFE_REQUESTS.INTERVAL_MILLISECONDS - elapsedTime).then(() => {
                        runNextRequest();
                    });
                }
                return runNextRequest();
            });
        }
        return Promise.resolve();
    };
    const promises: Promise<any>[] = [];
    for (let i = 0; i < (maxConcurrent || maxProcessing); i++) {
        promises.push(runNextRequest());
    }
    await Promise.all(promises);
    return results;
}
