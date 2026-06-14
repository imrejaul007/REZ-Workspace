import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../src/marketplace/services/products.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  createProduct,
  createMockPrismaService,
} from '../factories';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [createProduct(), createProduct()];
      mockPrisma.vendorOffering.findMany.mockResolvedValue(products);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalled();
    });

    it('should include vendor info', async () => {
      const products = [createProduct()];
      mockPrisma.vendorOffering.findMany.mockResolvedValue(products);

      const result = await service.findAll({});

      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Object),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return product by ID', async () => {
      const product = createProduct({ id: 'product-123' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      const result = await service.findOne('product-123');

      expect(result).toEqual(product);
    });

    it('should return null for invalid ID', async () => {
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(null);

      const result = await service.findOne('invalid-id');

      expect(result).toBeNull();
    });

    it('should include vendor info', async () => {
      const product = createProduct({ id: 'product-123' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      const result = await service.findOne('product-123');

      expect(mockPrisma.vendorOffering.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.any(Object),
        }),
      );
    });
  });

  describe('create', () => {
    const createProductDto = {
      vendorId: 'vendor-123',
      title: 'Fresh Paneer Tikka',
      description: 'Authentic North Indian dish',
      category: 'food',
      priceRange: '₹250-400',
    };

    it('should create product with valid data', async () => {
      const newProduct = createProduct({ ...createProductDto });

      mockPrisma.vendorOffering.create.mockResolvedValue(newProduct);

      const result = await service.create(createProductDto);

      expect(result).toHaveProperty('id');
      expect(mockPrisma.vendorOffering.create).toHaveBeenCalled();
    });

    it('should create product with correct data', async () => {
      let capturedData: any;
      mockPrisma.vendorOffering.create.mockImplementation(async (data) => {
        capturedData = data.data;
        return createProduct({ ...data.data, id: 'new-id' });
      });

      await service.create(createProductDto);

      expect(capturedData.title).toBe('Fresh Paneer Tikka');
      expect(capturedData.category).toBe('food');
    });
  });

  describe('update', () => {
    const productId = 'product-123';

    it('should update product title', async () => {
      const existingProduct = createProduct({ id: productId });
      mockPrisma.vendorOffering.update.mockResolvedValue({
        ...existingProduct,
        title: 'Updated Title',
      });

      const result = await service.update(productId, { title: 'Updated Title' });

      expect(mockPrisma.vendorOffering.update).toHaveBeenCalled();
    });

    it('should update product description', async () => {
      const existingProduct = createProduct({ id: productId });
      mockPrisma.vendorOffering.update.mockResolvedValue({
        ...existingProduct,
        description: 'Updated description',
      });

      const result = await service.update(productId, { description: 'Updated description' });

      expect(result.description).toBe('Updated description');
    });

    it('should update product price', async () => {
      const existingProduct = createProduct({ id: productId });
      mockPrisma.vendorOffering.update.mockResolvedValue({
        ...existingProduct,
        priceRange: '₹300-500',
      });

      const result = await service.update(productId, { priceRange: '₹300-500' });

      expect(result.priceRange).toBe('₹300-500');
    });

    it('should toggle isActive status', async () => {
      const existingProduct = createProduct({ id: productId, isActive: true });
      mockPrisma.vendorOffering.update.mockResolvedValue({
        ...existingProduct,
        isActive: false,
      });

      const result = await service.update(productId, { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete product', async () => {
      const productId = 'product-123';
      const existingProduct = createProduct({ id: productId });
      mockPrisma.vendorOffering.delete.mockResolvedValue(existingProduct);

      const result = await service.remove(productId);

      expect(mockPrisma.vendorOffering.delete).toHaveBeenCalledWith({
        where: { id: productId },
      });
    });
  });
});

describe('Product Edge Cases', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  it('should create product with provided data', async () => {
    mockPrisma.vendorOffering.create.mockImplementation(async (data) => {
      return data.data;
    });

    const result = await service.create({
      title: 'Test Product',
      description: 'Test description',
    });

    expect(result.title).toBe('Test Product');
    expect(result.description).toBe('Test description');
  });

  it('should handle special characters in title', async () => {
    mockPrisma.vendorOffering.create.mockImplementation(async (data) => {
      return data.data;
    });

    const result = await service.create({
      title: "Chef's Special @#$%",
      description: 'Test',
    });

    expect(result.title).toBe("Chef's Special @#$%");
  });
});
