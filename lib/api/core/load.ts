export const load = (page: string) => ({
    method: 'post',
    url: 'core/v4/load',
    params: { page },
});
