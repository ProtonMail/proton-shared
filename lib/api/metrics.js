export const sendMetricsReport = ({ Log, ID, aJSON }) => ({
    method: 'post',
    url: 'metrics',
    data: { Log, ID, aJSON },
});

export const sendSimpleMetrics = ({ Category, Action, Label }) => ({
    method: 'get',
    url: 'metrics',
    data: { Category, Action, Label },
});
