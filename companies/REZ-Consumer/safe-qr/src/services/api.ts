import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

class ApiService {
 private client: AxiosInstance;

 constructor() {
   this.client = axios.create({
     baseURL: config.apiUrl,
     timeout: 15000,
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // Add auth token to requests
   this.client.interceptors.request.use(async (config) => {
     const token = await AsyncStorage.getItem('authToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   // Handle errors
   this.client.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         // Handle unauthorized - redirect to login
         AsyncStorage.removeItem('authToken');
       }
       return Promise.reject(error);
     }
   );
 }

 // ==========================================
 // SCAN ENDPOINTS
 // ==========================================

 async scan(shortcode: string) {
   const response = await this.client.get(`${config.endpoints.scan}/${shortcode}`);
   return response.data;
 }

 async sendMessage(shortcode: string, message: { content: string; type: string; templateId?: string; location?: unknown }) {
   const response = await this.client.post(`${config.endpoints.scan}/${shortcode}/message`, message);
   return response.data;
 }

 // ==========================================
 // QR ENDPOINTS
 // ==========================================

 async getMyQRs() {
   const response = await this.client.get(`${config.endpoints.qr}/my`);
   return response.data;
 }

 async createQR(data: { mode: string; profile; settings?: unknown }) {
   const response = await this.client.post(config.endpoints.qr, data);
   return response.data;
 }

 async getQRDetail(shortcode: string) {
   const response = await this.client.get(`${config.endpoints.qr}/${shortcode}`);
   return response.data;
 }

 async updateQR(shortcode: string, data) {
   const response = await this.client.put(`${config.endpoints.qr}/${shortcode}`, data);
   return response.data;
 }

 async deleteQR(shortcode: string) {
   const response = await this.client.delete(`${config.endpoints.qr}/${shortcode}`);
   return response.data;
 }

 async activateLostMode(shortcode: string, data: { lastSeenLocation?; reward?: unknown }) {
   const response = await this.client.post(`${config.endpoints.qr}/${shortcode}/lost`, data);
   return response.data;
 }

 async markAsFound(shortcode: string, helperIds: string[] = []) {
   const response = await this.client.post(`${config.endpoints.qr}/${shortcode}/found`, { helperIds });
   return response.data;
 }

 async generateQRImage(shortcode: string, options?: { format?: string; size?: number }) {
   const params = new URLSearchParams();
   if (options?.format) params.append('format', options.format);
   if (options?.size) params.append('size', options.size.toString());

   const response = await this.client.get(
     `${config.endpoints.qr}/${shortcode}/generate?${params.toString()}`,
     { responseType: 'arraybuffer' }
   );
   return response.data;
 }

 // ==========================================
 // SESSIONS ENDPOINTS
 // ==========================================

 async getSessions() {
   const response = await this.client.get(config.endpoints.sessions);
   return response.data;
 }

 async getSessionMessages(sessionId: string, limit = 50) {
   const response = await this.client.get(
     `${config.endpoints.sessions}/${sessionId}/messages?limit=${limit}`
   );
   return response.data;
 }

 async sendSessionMessage(sessionId: string, message: { content: string; type: string }) {
   const response = await this.client.post(
     `${config.endpoints.sessions}/${sessionId}/messages`,
     message
   );
   return response.data;
 }

 async markSessionRead(sessionId: string) {
   const response = await this.client.post(`${config.endpoints.sessions}/${sessionId}/read`);
   return response.data;
 }

 async closeSession(sessionId: string) {
   const response = await this.client.delete(`${config.endpoints.sessions}/${sessionId}`);
   return response.data;
 }

 // ==========================================
 // KARMA ENDPOINTS
 // ==========================================

 async getKarmaState() {
   const response = await this.client.get(`${config.endpoints.karma}/state`);
   return response.data;
 }

 async getKarmaHistory(limit = 50) {
   const response = await this.client.get(`${config.endpoints.karma}/history?limit=${limit}`);
   return response.data;
 }

 async getKarmaLeaderboard(limit = 10) {
   const response = await this.client.get(`${config.endpoints.karma}/leaderboard?limit=${limit}`);
   return response.data;
 }

 async getNearbyFeed(lat: number, lng: number, radius = 5000) {
   const response = await this.client.get(
     `${config.endpoints.karma}/feed/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
   );
   return response.data;
 }

 async joinAsHelper(postId: string) {
   const response = await this.client.post(`${config.endpoints.karma}/feed/${postId}/help`);
   return response.data;
 }

 async postToFeed(data: { safeQRId: string; title: string; description: string; location?; photos?: string[]; reward?: unknown }) {
   const response = await this.client.post(`${config.endpoints.karma}/feed/lost`, data);
   return response.data;
 }

 // ==========================================
 // MODES ENDPOINTS
 // ==========================================

 async getModes() {
   const response = await this.client.get(`${config.endpoints.modes}/modes`);
   return response.data;
 }

 async getModePublicProfile(shortcode: string) {
   const response = await this.client.get(`${config.endpoints.modes}/${shortcode}/public`);
   return response.data;
 }

 // ==========================================
 // USER ENDPOINTS
 // ==========================================

 async getProfile() {
   const response = await this.client.get(config.endpoints.profile);
   return response.data;
 }

 async updateProfile(data) {
   const response = await this.client.put(config.endpoints.profile, data);
   return response.data;
 }

 // ==========================================
 // BLOCKS ENDPOINTS
 // ==========================================

 async getBlocks() {
   const response = await this.client.get('/blocks');
   return response.data;
 }

 async blockUser(userId: string, reason?: string) {
   const response = await this.client.post('/blocks', { userId, reason });
   return response.data;
 }

 async unblockUser(userId: string) {
   const response = await this.client.delete(`/blocks/${userId}`);
   return response.data;
 }

 async reportAbuse(type: string, targetId: string, reason: string, messageId?: string) {
   const response = await this.client.post('/blocks/report', { type, targetId, reason, messageId });
   return response.data;
 }

 // ==========================================
 // AUTH ENDPOINTS
 // ==========================================

 async login(phone: string, otp: string) {
   const response = await this.client.post('/auth/login', { phone, otp });
   return response.data;
 }

 async requestOTP(phone: string) {
   const response = await this.client.post('/auth/request-otp', { phone });
   return response.data;
 }

 async verifyToken() {
   const response = await this.client.post('/auth/verify');
   return response.data;
 }
}

export const api = new ApiService();
export default api;
