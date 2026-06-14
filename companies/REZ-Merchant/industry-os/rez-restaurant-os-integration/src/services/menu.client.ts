/**
 * Menu Service Adapter
 * Connects to rez-menu-service (Port 4030)
 */

import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

const menuClient = axios.create({
  baseURL: SERVICE_URLS.MENU_SERVICE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': SERVICE_URLS.INTERNAL_TOKEN,
  },
});

export const menuService = {
  // Menu CRUD
  createMenu: async (data) => {
    const response = await menuClient.post('/api/v1/menus', data);
    return response.data;
  },

  getMenus: async (params?) => {
    const response = await menuClient.get('/api/v1/menus', { params });
    return response.data;
  },

  getMenu: async (menuId: string) => {
    const response = await menuClient.get(`/api/v1/menus/${menuId}`);
    return response.data;
  },

  updateMenu: async (menuId: string, data) => {
    const response = await menuClient.patch(`/api/v1/menus/${menuId}`, data);
    return response.data;
  },

  deleteMenu: async (menuId: string) => {
    const response = await menuClient.delete(`/api/v1/menus/${menuId}`);
    return response.data;
  },

  publishMenu: async (menuId: string) => {
    const response = await menuClient.post(`/api/v1/menus/${menuId}/publish`);
    return response.data;
  },

  duplicateMenu: async (menuId: string) => {
    const response = await menuClient.post(`/api/v1/menus/${menuId}/duplicate`);
    return response.data;
  },

  // Categories
  createCategory: async (menuId: string, data) => {
    const response = await menuClient.post(`/api/v1/menus/${menuId}/categories`, data);
    return response.data;
  },

  getCategories: async (menuId: string) => {
    const response = await menuClient.get(`/api/v1/menus/${menuId}/categories`);
    return response.data;
  },

  updateCategory: async (menuId: string, categoryId: string, data) => {
    const response = await menuClient.patch(`/api/v1/menus/${menuId}/categories/${categoryId}`, data);
    return response.data;
  },

  deleteCategory: async (menuId: string, categoryId: string) => {
    const response = await menuClient.delete(`/api/v1/menus/${menuId}/categories/${categoryId}`);
    return response.data;
  },

  // Items
  createItem: async (menuId: string, data) => {
    const response = await menuClient.post(`/api/v1/menus/${menuId}/items`, data);
    return response.data;
  },

  getItems: async (menuId: string, params?) => {
    const response = await menuClient.get(`/api/v1/menus/${menuId}/items`, { params });
    return response.data;
  },

  getItem: async (menuId: string, itemId: string) => {
    const response = await menuClient.get(`/api/v1/menus/${menuId}/items/${itemId}`);
    return response.data;
  },

  updateItem: async (menuId: string, itemId: string, data) => {
    const response = await menuClient.patch(`/api/v1/menus/${menuId}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (menuId: string, itemId: string) => {
    const response = await menuClient.delete(`/api/v1/menus/${menuId}/items/${itemId}`);
    return response.data;
  },

  // Availability
  toggleAvailability: async (menuId: string, itemId: string, available: boolean) => {
    const response = await menuClient.patch(`/api/v1/menus/${menuId}/items/${itemId}`, { available });
    return response.data;
  },

  // AI Recommendations
  getRecommendations: async (data) => {
    const response = await menuClient.post('/api/v1/recommendations', data);
    return response.data;
  },

  // Analytics
  getAnalytics: async (menuId: string, params?) => {
    const response = await menuClient.get(`/api/v1/menus/${menuId}/analytics`, { params });
    return response.data;
  },
};
