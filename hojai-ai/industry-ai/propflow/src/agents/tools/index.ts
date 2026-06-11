/**
 * PROPFLOW - Tools Index
 * Export all available tools
 */

export { PropertySearchTool } from './propertySearch';
export { BudgetAnalysisTool } from './budgetAnalysis';
export { IntentDetectionTool } from './intentDetection';
export { CalendarCheckTool } from './calendarCheck';
export { PricingAnalysisTool } from './pricingAnalysis';

import { PropertySearchTool } from './propertySearch';
import { BudgetAnalysisTool } from './budgetAnalysis';
import { IntentDetectionTool } from './intentDetection';
import { CalendarCheckTool } from './calendarCheck';
import { PricingAnalysisTool } from './pricingAnalysis';

export const propflowTools = [
  new PropertySearchTool(),
  new BudgetAnalysisTool(),
  new IntentDetectionTool(),
  new CalendarCheckTool(),
  new PricingAnalysisTool()
];

export default propflowTools;