export const sendFeedback = (Score: number, Feedback: string) => ({
    url: `v4/feedback`,
    method: 'post',
    data: { Score, Feedback },
});
