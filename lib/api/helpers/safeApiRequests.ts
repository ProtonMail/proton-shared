import { wait } from '../../helpers/promise';

/**
 * Process multiple requests involving API calls safely to avoid getting jailed
 * @param interval      should be in milliseconds
 */
export async function processApiRequestsSafe<T>(
    requests: (() => Promise<T>)[],
    apiCallsPerRequest = 1,
    interval = 900 * 1000,
    maxCallsPerInterval = 25000
): Promise<T[]> {
    const maxRequestsPerInterval = Math.floor(maxCallsPerInterval / apiCallsPerRequest);
    const queue = requests.map((request, index) => ({ request, index }));
    const results: T[] = [];
    let totalResolved = 0;
    let iterations = 0;

    const process = async (): Promise<any> => {
        const leftover = iterations * maxRequestsPerInterval - totalResolved;
        const concurrentRequests = maxRequestsPerInterval - leftover;
        if (concurrentRequests === 0) {
            await wait(interval);
            return process();
        }
        const requests = queue.splice(0, concurrentRequests);
        iterations += 1;
        const promises = Promise.all(
            requests.map(({ request, index }) => {
                return request().then((result) => {
                    totalResolved += 1;
                    results[index] = result;
                });
            })
        );
        if (!queue.length) {
            await promises;
            return;
        }
        await wait(interval);
        return process();
    };

    await process();

    return results;
}
