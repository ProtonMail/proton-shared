export const load = (app: string, page: string) => ({
    method: 'post',
    url: 'core/v4/load',
    params: { app, page },
});
