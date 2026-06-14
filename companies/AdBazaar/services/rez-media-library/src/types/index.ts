export type AssetType = 'image' | 'video' | 'audio' | 'document' | 'gif';
export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'error';
export type Visibility = 'public' | 'private' | 'organization';

export interface Asset {
  id: string;
  tenantId: string;
  name: string;
  originalName: string;
  type: AssetType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnailUrl?: string;
  status: AssetStatus;
  visibility: Visibility;
  folderId?: string;
  collectionId?: string;
  tags: string[];
  metadata: {
    uploadedBy: string;
    source?: string;
    credit?: string;
    copyright?: string;
    colors?: string[];
    faces?: number;
  };
  variants: AssetVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetVariant {
  id: string;
  name: string;
  width?: number;
  height?: number;
  size: number;
  url: string;
  format: string;
}

export interface Collection {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  coverAssetId?: string;
  visibility: Visibility;
  assetCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  tenantId: string;
  name: string;
  parentId?: string;
  path: string;
  assetCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface AssetSearchQuery {
  query?: string;
  type?: AssetType;
  folderId?: string;
  collectionId?: string;
  tags?: string[];
  visibility?: Visibility;
  mimeTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'name' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
