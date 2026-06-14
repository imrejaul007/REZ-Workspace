/**
 * Core domain router: auth, store catalog, products, uploads, dashboard.
 */
import { Router } from 'express';
import authRoutes from '../routes/auth';
import storeRoutes from '../routes/stores';
import productRoutes from '../routes/products';
import dashboardRoutes from '../routes/dashboard';
import categoryRoutes from '../routes/categories';
import profileRoutes from '../routes/profile';
import uploadRoutes from '../routes/uploads';
import syncRoutes from '../routes/sync';
import productGalleryRoutes from '../routes/productGallery';
import storeGalleryRoutes from '../routes/storeGallery';
import productRestoreRoutes from '../routes/productRestore';
import variantsRoutes from '../routes/variants';
import onboardingRoutes from '../routes/onboarding';
import merchantProfileRoutes from '../routes/merchantProfile';
import merchantsRoutes from '../routes/merchants';
import outletsRoutes from '../routes/outlets';
import customersRoutes from '../routes/customers';
import rezNowConfigRoutes from '../routes/rezNowConfig';
import rezNowSetupRoutes from '../routes/rezNowSetup';
import creatorAnalyticsRoutes from '../routes/creatorAnalytics';
import storeLinksRoutes from '../routes/storeLinks';
import storeAnalyticsRoutes from '../routes/storeAnalytics';
import qrCodeRoutes from '../routes/qrCode';
import rezNowServicesRoutes from '../routes/rezNowServices';
import galleryRoutes from '../routes/gallery';
import intelligenceRoutes from '../routes/intelligence';

const router = Router();

router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoryRoutes);
router.use('/profile', profileRoutes);
router.use('/uploads', uploadRoutes);
router.use('/sync', syncRoutes);
router.use('/product-gallery', productGalleryRoutes);
router.use('/store-gallery', storeGalleryRoutes);
router.use('/product-restore', productRestoreRoutes);
router.use('/variants', variantsRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/merchant-profile', merchantProfileRoutes);
router.use('/merchants', merchantsRoutes);
router.use('/outlets', outletsRoutes);
router.use('/customers', customersRoutes);
router.use('/rez-now-config', rezNowConfigRoutes);
router.use('/menu', rezNowSetupRoutes);
router.use('/store-links', storeLinksRoutes);
router.use('/store-analytics', storeAnalyticsRoutes);
router.use('/qr', qrCodeRoutes);
router.use('/rez-now-services', rezNowServicesRoutes);
router.use('/gallery', galleryRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/', creatorAnalyticsRoutes);

export default router;
