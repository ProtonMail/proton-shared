import { Feature } from '../interfaces/Feature';

export const getFeature = (featureCode: string) => ({
    url: `features/${featureCode}`,
    method: 'get',
});

export const updateFeature = (feature: Feature) => ({
    url: `features/${feature.Code}`,
    method: 'put',
    data: { Feature: feature },
});
