import { MenuEngineRequest, MenuEngineResponse } from '../types';
/**
 * Menu Engineer Service
 * Implements the classic Boston Consulting Group matrix for restaurants
 * - Stars: High margin, high popularity → Promote and protect
 * - Plowhorses: High popularity, low margin → Reprice or reformulate
 * - Puzzles: Low popularity, high margin → Increase visibility
 * - Dogs: Low margin, low popularity → Remove or revamp
 */
export declare class MenuEngineerService {
    private readonly TARGET_MARGIN;
    private readonly POPULARITY_THRESHOLD;
    private readonly MARGIN_THRESHOLD;
    /**
     * Analyze menu and provide engineering recommendations
     */
    analyzeMenu(request: MenuEngineRequest): Promise<MenuEngineResponse>;
    /**
     * Calculate margin for each menu item
     */
    private calculateMargins;
    /**
     * Categorize items into BCG matrix quadrants
     */
    private categorizeItems;
    /**
     * Generate actionable recommendations for menu optimization
     */
    private generateRecommendations;
    /**
     * Suggest new menu items based on current gaps
     */
    private suggestNewItems;
    /**
     * Generate menu engineering report
     */
    generateReport(request: MenuEngineRequest): Promise<string>;
}
export declare const menuEngineerService: MenuEngineerService;
//# sourceMappingURL=menuEngineer.d.ts.map