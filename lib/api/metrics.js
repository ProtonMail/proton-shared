export const sendMetricsReport = ({ Log, ID, SomeJSON }) => ({
    method: 'post',
    url: 'metrics',
    data: { Log, ID, SomeJSON }
});

export const sendSimpleMetrics = ({ Category, Action, Label }) => ({
    method: 'post',
    url: 'metrics',
    data: { Category, Action, Label }
});
