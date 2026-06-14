import { Router } from 'express';
import { merchantAuth, requireVerifiedMerchant } from '../../middleware/auth';
import { applyProductWriters, registerCrudRoutes } from './crud';
import { registerVariantRoutes, registerToggleFeaturedRoute, registerInventoryRoute, register86Routes } from './management';
import { registerSearchRoutes, registerFeedbackRoute, registerImportTemplateRoute, registerExportRoute, registerImportRoute, registerBulkImportRoute } from './search';
import { registerCategoryRoutes } from './categories';

const router = Router();

// Apply auth middleware once at the top level
applyProductWriters(router);

// Mount sub-routers
const crudRouter = Router();
registerCrudRoutes(crudRouter);
router.use('/', crudRouter);

const managementRouter = Router();
registerVariantRoutes(managementRouter);
registerToggleFeaturedRoute(managementRouter);
registerInventoryRoute(managementRouter);
register86Routes(managementRouter);
router.use('/', managementRouter);

const searchRouter = Router();
registerSearchRoutes(searchRouter);
registerFeedbackRoute(searchRouter);
registerImportTemplateRoute(searchRouter);
registerExportRoute(searchRouter);
registerImportRoute(searchRouter);
registerBulkImportRoute(searchRouter);
router.use('/', searchRouter);

const categoriesRouter = Router();
registerCategoryRoutes(categoriesRouter);
router.use('/', categoriesRouter);

export default router;
