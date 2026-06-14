export enum UserRole {
  ADMIN = 'ADMIN',
  RESTAURANT = 'RESTAURANT',
  EMPLOYEE = 'EMPLOYEE',
  VENDOR = 'VENDOR',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  restaurant?: Restaurant;
  vendor?: Vendor;
  employee?: Employee;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  cuisineType: string[];
  licenseNumber?: string;
  gstNumber?: string;
  fssaiNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  userId: string;
  companyName: string;
  description?: string;
  logo?: string;
  businessType: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  restaurantId: string;
  branchId?: string;
  employeeCode: string;
  designation: string;
  department?: string;
  aadharNumber?: string;
  aadharVerified: boolean;
  verifiedAt?: string;
  salary?: number;
  joiningDate: string;
  relievingDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  restaurantName?: string;
  cuisineType?: string[];
  companyName?: string;
  businessType?: string;
  restaurantId?: string;
  designation?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}