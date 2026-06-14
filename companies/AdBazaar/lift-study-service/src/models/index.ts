// Models index - imports all models to register them with mongoose
export { LiftStudy, ILiftStudy } from './LiftStudy';
export { BrandLift, IBrandLift } from './BrandLift';
export { ConversionLift, IConversionLift } from './ConversionLift';
export { Survey, ISurvey, ISurveyQuestion } from './Survey';
export { LiftResult, ILiftResult, ILiftMetricResult } from './LiftResult';
export { SurveyResponse, ISurveyResponse } from './SurveyResponse';

// Import models to ensure they are registered
import './LiftStudy';
import './BrandLift';
import './ConversionLift';
import './Survey';
import './LiftResult';
import './SurveyResponse';