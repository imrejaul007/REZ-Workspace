import {
  PinterestAccount,
  PinterestBoard,
  PinterestPin,
  PinterestComment,
  PinterestAnalytics,
  IPinterestAccountDocument,
  IPinterestBoardDocument,
  IPinterestPinDocument,
  IPinterestCommentDocument,
  IPinterestAnalyticsDocument,
} from '../models';
import { PinterestApiClient, PinterestApiError } from './pinterestApi.service';
import logger from 'utils/logger.js';
import {
  ICreatePinRequest,
  ICreateBoardRequest,
  IUpdatePinRequest,
  IUpdateBoardRequest,
  ISchedulePinRequest,
  ICreateIdeaPinRequest,
  IPinterestUser,
} from '../types';
import { v4 as uuidv4 } from 'crypto';

export class PinterestService {
  private apiClient: PinterestApiClient;

  constructor(accessToken?: string) {
    this.apiClient = new PinterestApiClient(accessToken);
  }

  setAccessToken(token: string): void {
    this.apiClient.setAccessToken(token);
  }

  // Account Operations
  async connectAccount(pinterestUserId: string, accessToken: string, refreshToken?: string): Promise<IPinterestAccountDocument> {
    try {
      // Get user info from Pinterest
      this.apiClient.setAccessToken(accessToken);
      const userInfo = await this.apiClient.getCurrentUser();

      // Check if account already exists
      let account = await PinterestAccount.findOne({ pinterestUserId: userInfo.id });

      if (account) {
        // Update existing account
        account.accessToken = accessToken;
        if (refreshToken) account.refreshToken = refreshToken;
        account.followerCount = userInfo.follower_count || 0;
        account.followingCount = userInfo.following_count || 0;
        await account.save();
      } else {
        // Create new account
        account = new PinterestAccount({
          id: uuidv4(),
          pinterestUserId: userInfo.id,
          username: userInfo.username,
          displayName: userInfo.display_name,
          profileImage: userInfo.image_url,
          websiteUrl: userInfo.website_url,
          followerCount: userInfo.follower_count || 0,
          followingCount: userInfo.following_count || 0,
          connectedAt: new Date(),
          accessToken,
          refreshToken,
        });
        await account.save();

        logger.info(`Connected new Pinterest account: ${userInfo.username}`);
      }

      return account;
    } catch (error) {
      logger.error('Failed to connect Pinterest account:', error);
      throw error;
    }
  }

  async getAccounts(): Promise<IPinterestAccountDocument[]> {
    return PinterestAccount.find().sort({ connectedAt: -1 });
  }

  async getAccountById(accountId: string): Promise<IPinterestAccountDocument | null> {
    return PinterestAccount.findOne({ id: accountId });
  }

  async getAccountByPinterestId(pinterestUserId: string): Promise<IPinterestAccountDocument | null> {
    return PinterestAccount.findOne({ pinterestUserId });
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const account = await PinterestAccount.findOne({ id: accountId });
    if (account) {
      account.accessToken = undefined;
      account.refreshToken = undefined;
      await account.save();
    }
  }

  // Board Operations
  async syncBoards(accountId: string): Promise<IPinterestBoardDocument[]> {
    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const response = await this.apiClient.getBoards();

    const boards: IPinterestBoardDocument[] = [];
    for (const board of response.items) {
      let dbBoard = await PinterestBoard.findOne({ pinterestBoardId: board.id });

      if (dbBoard) {
        dbBoard.name = board.name;
        dbBoard.description = board.description;
        dbBoard.privacy = board.privacy === 'PUBLIC' ? 'public' : 'secret';
        dbBoard.pinCount = board.pin_count || 0;
        dbBoard.followerCount = board.follower_count || 0;
        dbBoard.coverImage = board.cover_image?.url;
        await dbBoard.save();
      } else {
        dbBoard = new PinterestBoard({
          id: uuidv4(),
          pinterestBoardId: board.id,
          accountId: account.id,
          name: board.name,
          description: board.description,
          privacy: board.privacy === 'PUBLIC' ? 'public' : 'secret',
          pinCount: board.pin_count || 0,
          followerCount: board.follower_count || 0,
          coverImage: board.cover_image?.url,
        });
        await dbBoard.save();
      }
      boards.push(dbBoard);
    }

    logger.info(`Synced ${boards.length} boards for account ${accountId}`);
    return boards;
  }

  async getBoards(accountId: string): Promise<IPinterestBoardDocument[]> {
    return PinterestBoard.find({ accountId }).sort({ name: 1 });
  }

  async getBoardById(boardId: string): Promise<IPinterestBoardDocument | null> {
    return PinterestBoard.findOne({ id: boardId });
  }

  async createBoard(accountId: string, data: ICreateBoardRequest): Promise<IPinterestBoardDocument> {
    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const pinterestBoard = await this.apiClient.createBoard(
      data.name,
      data.description,
      data.privacy === 'secret' ? 'SECRET' : 'PUBLIC'
    );

    const board = new PinterestBoard({
      id: uuidv4(),
      pinterestBoardId: pinterestBoard.id,
      accountId,
      name: pinterestBoard.name,
      description: pinterestBoard.description,
      privacy: pinterestBoard.privacy === 'PUBLIC' ? 'public' : 'secret',
      pinCount: pinterestBoard.pin_count || 0,
      followerCount: pinterestBoard.follower_count || 0,
      coverImage: pinterestBoard.cover_image?.url,
    });
    await board.save();

    logger.info(`Created board: ${board.name} for account ${accountId}`);
    return board;
  }

  async updateBoard(boardId: string, data: IUpdateBoardRequest): Promise<IPinterestBoardDocument> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error('Board not found');

    const account = await this.getAccountById(board.accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    await this.apiClient.updateBoard(board.pinterestBoardId, {
      name: data.name,
      description: data.description,
      privacy: data.privacy === 'secret' ? 'SECRET' : 'PUBLIC',
    });

    if (data.name) board.name = data.name;
    if (data.description !== undefined) board.description = data.description;
    if (data.privacy) board.privacy = data.privacy;
    await board.save();

    return board;
  }

  async deleteBoard(boardId: string): Promise<void> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error('Board not found');

    const account = await this.getAccountById(board.accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    await this.apiClient.deleteBoard(board.pinterestBoardId);
    await PinterestBoard.deleteOne({ id: boardId });

    logger.info(`Deleted board: ${board.name}`);
  }

  // Pin Operations
  async syncPins(boardId: string): Promise<IPinterestPinDocument[]> {
    const board = await this.getBoardById(boardId);
    if (!board) throw new Error('Board not found');

    const account = await this.getAccountById(board.accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const response = await this.apiClient.getPins(board.pinterestBoardId);

    const pins: IPinterestPinDocument[] = [];
    for (const pin of response.items) {
      let dbPin = await PinterestPin.findOne({ pinterestPinId: pin.id });

      if (dbPin) {
        dbPin.title = pin.title;
        dbPin.description = pin.description || '';
        dbPin.link = pin.link;
        dbPin.mediaUrl = pin.media?.url || '';
        dbPin.mediaType = pin.media?.type || 'image';
        dbPin.altText = pin.alt_text;
        await dbPin.save();
      } else {
        dbPin = new PinterestPin({
          id: uuidv4(),
          pinterestPinId: pin.id,
          boardId: board.id,
          accountId: board.accountId,
          title: pin.title,
          description: pin.description || '',
          link: pin.link,
          mediaUrl: pin.media?.url || '',
          mediaType: pin.media?.type || 'image',
          altText: pin.alt_text,
          status: 'published',
          publishedAt: new Date(),
        });
        await dbPin.save();
      }
      pins.push(dbPin);
    }

    return pins;
  }

  async getPins(accountId: string, boardId?: string): Promise<IPinterestPinDocument[]> {
    const query: any = { accountId };
    if (boardId) query.boardId = boardId;
    return PinterestPin.find(query).sort({ createdAt: -1 });
  }

  async getPinById(pinId: string): Promise<IPinterestPinDocument | null> {
    return PinterestPin.findOne({ id: pinId });
  }

  async createPin(accountId: string, data: ICreatePinRequest): Promise<IPinterestPinDocument> {
    const board = await this.getBoardById(data.boardId);
    if (!board) throw new Error('Board not found');

    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const pinterestPin = await this.apiClient.createPin({
      boardId: board.pinterestBoardId,
      title: data.title,
      description: data.description,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      link: data.link,
      altText: data.altText,
    });

    const pin = new PinterestPin({
      id: uuidv4(),
      pinterestPinId: pinterestPin.id,
      boardId: board.id,
      accountId,
      title: pinterestPin.title,
      description: pinterestPin.description || '',
      link: pinterestPin.link,
      mediaUrl: pinterestPin.media?.url || '',
      mediaType: pinterestPin.media?.type || 'image',
      altText: pinterestPin.alt_text,
      keywords: data.keywords || [],
      ctaLink: data.ctaLink,
      status: 'published',
      publishedAt: new Date(),
    });
    await pin.save();

    // Update board pin count
    board.pinCount += 1;
    await board.save();

    logger.info(`Created pin: ${pin.title}`);
    return pin;
  }

  async updatePin(pinId: string, data: IUpdatePinRequest): Promise<IPinterestPinDocument> {
    const pin = await this.getPinById(pinId);
    if (!pin) throw new Error('Pin not found');

    const account = await this.getAccountById(pin.accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    await this.apiClient.updatePin(pin.pinterestPinId, {
      title: data.title,
      description: data.description,
      link: data.link,
      alt_text: data.altText,
    });

    if (data.title) pin.title = data.title;
    if (data.description !== undefined) pin.description = data.description;
    if (data.link !== undefined) pin.link = data.link;
    if (data.altText !== undefined) pin.altText = data.altText;
    if (data.keywords) pin.keywords = data.keywords;
    if (data.ctaLink !== undefined) pin.ctaLink = data.ctaLink;
    await pin.save();

    return pin;
  }

  async deletePin(pinId: string): Promise<void> {
    const pin = await this.getPinById(pinId);
    if (!pin) throw new Error('Pin not found');

    const account = await this.getAccountById(pin.accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    await this.apiClient.deletePin(pin.pinterestPinId);

    // Update board pin count
    const board = await this.getBoardById(pin.boardId);
    if (board) {
      board.pinCount = Math.max(0, board.pinCount - 1);
      await board.save();
    }

    await PinterestPin.deleteOne({ id: pinId });
    logger.info(`Deleted pin: ${pin.title}`);
  }

  async schedulePin(pinId: string, data: ISchedulePinRequest): Promise<IPinterestPinDocument> {
    const pin = await this.getPinById(pinId);
    if (!pin) throw new Error('Pin not found');

    pin.status = 'scheduled';
    pin.scheduledTime = new Date(data.scheduledTime);
    await pin.save();

    logger.info(`Scheduled pin ${pinId} for ${data.scheduledTime}`);
    return pin;
  }

  // Idea Pin Operations (Story format)
  async createIdeaPin(accountId: string, data: ICreateIdeaPinRequest): Promise<IPinterestPinDocument> {
    const board = await this.getBoardById(data.boardId);
    if (!board) throw new Error('Board not found');

    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const pinterestPin = await this.apiClient.createIdeaPin({
      boardId: board.pinterestBoardId,
      title: data.title,
      description: data.description,
      mediaSources: data.mediaUrls.map((url) => ({ url, type: 'image_url' as const })),
      link: data.link,
      altText: data.altText,
    });

    const pin = new PinterestPin({
      id: uuidv4(),
      pinterestPinId: pinterestPin.id,
      boardId: board.id,
      accountId,
      title: pinterestPin.title,
      description: pinterestPin.description || '',
      link: pinterestPin.link,
      mediaUrl: data.mediaUrls[0] || '',
      mediaType: 'image',
      altText: pinterestPin.alt_text,
      keywords: data.keywords || [],
      status: 'published',
      publishedAt: new Date(),
    });
    await pin.save();

    board.pinCount += 1;
    await board.save();

    logger.info(`Created idea pin: ${pin.title}`);
    return pin;
  }

  // Analytics Operations
  async getAnalytics(accountId: string, startDate: string, endDate: string): Promise<IPinterestAnalyticsDocument[]> {
    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    const analytics = await this.apiClient.getAnalytics(startDate, endDate);

    // Save analytics to database
    const analyticsRecord = new PinterestAnalytics({
      id: uuidv4(),
      accountId,
      date: new Date(),
      impressions: analytics.summary.impressions,
      saves: analytics.summary.saves,
      clicks: analytics.summary.clicks,
      repins: analytics.summary.repins,
      comments: analytics.summary.comments,
    });
    await analyticsRecord.save();

    return [analyticsRecord];
  }

  async getAudienceInsights(accountId: string): Promise<any> {
    const account = await this.getAccountById(accountId);
    if (!account) throw new Error('Account not found');

    this.apiClient.setAccessToken(account.accessToken!);
    return this.apiClient.getAudienceInsights();
  }

  // Comment Operations
  async getComments(accountId: string, pinId?: string): Promise<IPinterestCommentDocument[]> {
    if (pinId) {
      return PinterestComment.find({ accountId, pinId }).sort({ createdAt: -1 });
    }
    return PinterestComment.find({ accountId }).sort({ createdAt: -1 });
  }

  async hideComment(commentId: string): Promise<IPinterestCommentDocument> {
    const comment = await PinterestComment.findOne({ id: commentId });
    if (!comment) throw new Error('Comment not found');

    comment.hidden = true;
    await comment.save();
    return comment;
  }
}

// Simple UUID generator function
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const pinterestService = new PinterestService();

export default PinterestService;