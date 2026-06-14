import { v4 as uuidv4 } from 'uuid';
import { Folder, IFolder } from '../models/Folder';
import { Asset } from '../models/Asset';
import { logger } from '../utils/logger';

export interface CreateFolderInput {
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
  permissions?: {
    public: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
  };
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  parentId?: string;
}

export class FolderService {
  async create(input: CreateFolderInput): Promise<IFolder> {
    try {
      const folderId = `folder-${uuidv4()}`;
      let path = `/${input.name}`;
      let depth = 0;

      // If parent exists, calculate path and depth
      if (input.parentId) {
        const parent = await Folder.findOne({ folderId: input.parentId });
        if (parent) {
          path = `${parent.path}/${input.name}`;
          depth = parent.depth + 1;
        }
      }

      const folder = new Folder({
        folderId,
        name: input.name,
        description: input.description,
        parentId: input.parentId,
        path,
        depth,
        createdBy: input.createdBy,
        permissions: input.permissions || { public: false }
      });

      await folder.save();

      // Update parent folder's subfolder count
      if (input.parentId) {
        await Folder.findOneAndUpdate(
          { folderId: input.parentId },
          { $inc: { subfolderCount: 1 } }
        );
      }

      logger.info('Folder created', { folderId, name: input.name, path });
      return folder;
    } catch (error) {
      logger.error('Failed to create folder', { error, input });
      throw error;
    }
  }

  async findById(folderId: string): Promise<IFolder | null> {
    try {
      return await Folder.findOne({ folderId });
    } catch (error) {
      logger.error('Failed to find folder', { error, folderId });
      throw error;
    }
  }

  async findAll(parentId?: string): Promise<IFolder[]> {
    try {
      const query = parentId ? { parentId } : { parentId: null };
      return await Folder.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Failed to list folders', { error, parentId });
      throw error;
    }
  }

  async findByPath(path: string): Promise<IFolder[]> {
    try {
      return await Folder.find({
        $or: [
          { path: { $regex: `^${path}` } },
          { folderId: path }
        ]
      }).sort({ depth: 1, name: 1 });
    } catch (error) {
      logger.error('Failed to find folders by path', { error, path });
      throw error;
    }
  }

  async update(folderId: string, input: UpdateFolderInput): Promise<IFolder | null> {
    try {
      const folder = await Folder.findOne({ folderId });
      if (!folder) return null;

      // If name is changing, update path for all subfolders
      if (input.name && input.name !== folder.name) {
        const oldPath = folder.path;
        const newPath = folder.parentId
          ? `${folder.path.replace(`/${folder.name}`, '')}/${input.name}`
          : `/${input.name}`;

        // Update all subfolder paths
        await Folder.updateMany(
          { path: { $regex: `^${oldPath}` } },
          { $set: { path: (folder as any)._doc.path.replace(oldPath, newPath) } }
        );
      }

      const updated = await Folder.findOneAndUpdate(
        { folderId },
        { $set: input },
        { new: true, runValidators: true }
      );

      if (updated) {
        logger.info('Folder updated', { folderId, input });
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update folder', { error, folderId, input });
      throw error;
    }
  }

  async delete(folderId: string): Promise<boolean> {
    try {
      const folder = await Folder.findOne({ folderId });
      if (!folder) return false;

      // Check if folder has assets or subfolders
      const [assetCount, subfolderCount] = await Promise.all([
        Asset.countDocuments({ folderId }),
        Folder.countDocuments({ parentId: folderId })
      ]);

      if (assetCount > 0 || subfolderCount > 0) {
        throw new Error('Folder is not empty. Move or delete contents first.');
      }

      await Folder.deleteOne({ folderId });

      // Update parent folder's subfolder count
      if (folder.parentId) {
        await Folder.findOneAndUpdate(
          { folderId: folder.parentId },
          { $inc: { subfolderCount: -1 } }
        );
      }

      logger.info('Folder deleted', { folderId });
      return true;
    } catch (error) {
      logger.error('Failed to delete folder', { error, folderId });
      throw error;
    }
  }

  async getFolderContents(folderId: string): Promise<{
    folders: IFolder[];
    assets: any[];
    totalFolders: number;
    totalAssets: number;
  }> {
    try {
      const [folders, assets] = await Promise.all([
        Folder.find({ parentId: folderId }).sort({ name: 1 }),
        Asset.find({ folderId, status: { $ne: 'deleted' } }).sort({ name: 1 })
      ]);

      return {
        folders,
        assets,
        totalFolders: folders.length,
        totalAssets: assets.length
      };
    } catch (error) {
      logger.error('Failed to get folder contents', { error, folderId });
      throw error;
    }
  }

  async getBreadcrumb(folderId: string): Promise<IFolder[]> {
    try {
      const breadcrumb: IFolder[] = [];
      let currentFolder = await Folder.findOne({ folderId });

      while (currentFolder) {
        breadcrumb.unshift(currentFolder);
        if (currentFolder.parentId) {
          currentFolder = await Folder.findOne({ folderId: currentFolder.parentId });
        } else {
          break;
        }
      }

      return breadcrumb;
    } catch (error) {
      logger.error('Failed to get breadcrumb', { error, folderId });
      throw error;
    }
  }
}

export const folderService = new FolderService();