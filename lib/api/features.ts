import { Feature as FeatureModel } from '../interfaces/Feature';

export const getFeature = (featureCode: string) => ({
    url: `features/${featureCode}`,
    method: 'get',
});

export const updateFeature = (Feature: FeatureModel) => ({
    url: `features/${Feature.Code}`,
    method: 'put',
    data: { Feature },
});
