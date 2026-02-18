import axios, { AxiosInstance } from 'axios';
import config from '../config/config.js';
import logger from '../config/logger.js';
import { getScannerConfig } from './scannerConfigService.js';
import { getActiveImvuCredentials } from './imvuAccountService.js';
import {
  Room,
  RoomsList,
  User,
  AvatarCard,
  AvatarAction,
  LoginConfig,
  Promotion,
  AuthenticationError,
  ImvuApiError,
} from '../types/index.js';

const isDev = config.server.env === 'development';

class ImvuApiClient {
  private readonly baseUrl: string;
  private userId: string;
  private authToken: string;
  private readonly client: AxiosInstance;

  constructor() {
    this.baseUrl = config.imvu.baseUrl;
    this.userId = config.imvu.userId;
    this.authToken = config.imvu.authToken;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        accept: 'application/json; charset=utf-8',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        origin: 'https://www.imvu.com',
        referer: 'https://www.imvu.com/next/chat/explore/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        cookie: config.imvu.cookie || '',
      },
    });

    logger.info('IMVU API Client initialized');
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (requestConfig) => {
        if (isDev) {
          logger.debug(`REQUEST: ${requestConfig.method?.toUpperCase()} ${requestConfig.baseURL}${requestConfig.url}`);
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = (error.config?.url ?? '') as string;
        const isRoomDetails = url.includes('/chat/chat-');
        if (error.response) {
          if (isRoomDetails && (error.response.status === 403 || error.response.status === 404)) {
            logger.debug(`IMVU API ${error.response.status} on room details (skipped): ${url.slice(0, 60)}...`);
          } else {
            logger.error(`IMVU API ${error.response.status}: ${this.getErrorMessage(error)}`);
          }
        } else {
          logger.error(`IMVU API network error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  public setCredentials(userId: string, authToken: string): void {
    this.userId = userId;
    this.authToken = authToken;
  }

  public setCookie(cookie: string): void {
    this.client.defaults.headers.common['cookie'] = cookie || '';
  }

  private getAuthHeaders(): Record<string, string> {
    if (!this.userId || !this.authToken) {
      throw new AuthenticationError('IMVU credentials not configured. Set IMVU_USER_ID and IMVU_AUTH_TOKEN.');
    }
    return {
      'X-imvu-userid': this.userId,
      'X-imvu-auth': this.authToken,
    };
  }

  public async getLoginConfig(): Promise<LoginConfig> {
    const systemInfo = encodeURIComponent(JSON.stringify({ windows_version: '10.0.2 (Build 26200)' }));
    const response = await this.client.get<LoginConfig>(
      `/api/client_login_config.php?system_info=${systemInfo}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  public async getAvatarCard(cid: string, viewerCid?: string): Promise<AvatarCard> {
    const viewer = viewerCid || this.userId;
    const response = await this.client.get<AvatarCard>(
      `/api/avatarcard.php?cid=${cid}&viewer_cid=${viewer}`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  public async getAvatarActions(): Promise<AvatarAction[]> {
    const response = await this.client.get<AvatarAction[]>('/api/avatar_actions.php', {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  public async getRoomsList(offset: number = 0, decode: boolean = true): Promise<RoomsList> {
    const decodeParam = decode ? 2 : 0;
    const params: Record<string, unknown> = {
      decode: decodeParam,
      null_upsell: true,
      cid: this.userId,
    };
    if (offset > 0) params.offset = offset;

    const response = await this.client.get<Record<string, unknown>>('/api/rooms/rooms_list_paginated.php', {
      params,
    });
    const data = response.data;

    if (data?.rooms && Array.isArray(data.rooms)) {
      return data as unknown as RoomsList;
    }

    const rooms: Room[] = [];
    const roomCount = (data?.name as string[] | undefined)?.length || 0;
    const nameArr = (data?.name as string[]) || [];
    const descArr = (data?.description as string[]) || [];
    const ownerArr = (data?.customers_id as number[]) || [];
    const maxArr = (data?.max_users as number[]) || [];
    const countArr = (data?.num_participants as number[]) || [];
    const thumbArr = (data?.image_url as string[]) || [];
    const roomIdArr = (data?.customers_room_id as string[]) || [];
    const partArr = (data?.participants as string[][]) || [];

    for (let i = 0; i < roomCount; i++) {
      const participants = partArr[i] || [];
      const users: User[] = participants.map((cid: string) => ({ cid, id: cid }));
      rooms.push({
        room_id: roomIdArr[i],
        id: roomIdArr[i],
        room_name: nameArr[i],
        name: nameArr[i],
        description: descArr[i],
        owner_id: String(ownerArr[i] ?? ''),
        is_public: true,
        max_users: maxArr[i],
        user_count: countArr[i],
        thumbnail: thumbArr[i],
        users,
        participants: users,
      });
    }

    return {
      rooms,
      total: data?.number_of_rooms as number | undefined,
      offset,
      has_more: rooms.length >= ((data?.rooms_per_page as number) || 24),
    };
  }

  public async getRoomDetails(roomId: string, version: string): Promise<{ occupants: unknown[] }> {
    try {
      const url = `https://api.imvu.com/chat/chat-${roomId}-${version}`;
      const cookie = typeof this.client.defaults.headers.common['cookie'] === 'string'
        ? this.client.defaults.headers.common['cookie']
        : '';
      const headers: Record<string, string> = {
        ...this.getAuthHeaders(),
        'X-imvu-application': 'welcome/1',
        origin: 'https://secure.imvu.com',
        referer: 'https://secure.imvu.com/',
      };
      if (cookie) headers['cookie'] = cookie;
      const response = await this.client.get<{ denormalized?: Record<string, { data?: { legacy_cid?: string; id?: string; name?: string; avatar_name?: string } }> }>(
        url,
        { headers }
      );
      const denormalized = response.data?.denormalized || {};
      const occupants: unknown[] = [];
      for (const key of Object.keys(denormalized)) {
        if (key.includes('/user/user-') && denormalized[key]?.data) {
          const d = denormalized[key].data!;
          occupants.push({
            cid: d.legacy_cid || d.id || '',
            display_name: d.name || d.avatar_name || 'Unknown',
            id: d.id || d.legacy_cid || '',
          });
        }
      }
      return { occupants };
    } catch {
      return { occupants: [] };
    }
  }

  public async getAllRooms(): Promise<Room[]> {
    const activeCreds = await getActiveImvuCredentials();
    if (activeCreds) {
      this.setCredentials(activeCreds.userId, activeCreds.authToken);
      this.setCookie(activeCreds.cookie);
    }
    if (!this.userId?.trim()) {
      throw new ImvuApiError('IMVU_USER_ID is not set. Set it in server .env or add an active IMVU account in Admin → IMVU Accounts.', 400);
    }
    const scannerConfig = await getScannerConfig();
    const { maxPages, pageSize, delayMs, keywords, roomType, hashtags, language } = scannerConfig;
    const allRooms: Room[] = [];
    let startIndex = 0;

    const cookieToSend =
      (activeCreds?.cookie?.trim()) ||
      (typeof this.client.defaults.headers.common['cookie'] === 'string' ? this.client.defaults.headers.common['cookie'] : '') ||
      '';

    const roomListBase = 'https://api.imvu.com';
    logger.info(`Room list: fetching up to ${maxPages} pages (pageSize=${pageSize})`);
    for (let pageCount = 0; pageCount < maxPages; pageCount++) {
      logger.info(`Room list: fetching page ${pageCount + 1} (start_index=${startIndex})...`);
      const url = `${roomListBase}/room_list/room_list-${this.userId}-explore/rooms`;
      const params: Record<string, string> = {
        keywords: keywords || '',
        rating: 'all',
        room_type: roomType || 'all',
        scene_occupancy_max: '10',
        scene_occupancy_min: '0',
        total_occupancy_max: '250',
        total_occupancy_min: '0',
        hashtags: hashtags || '',
        start_index: String(startIndex),
        limit: String(pageSize),
      };
      if (language?.trim()) params.language = language.trim();

      let response: { data?: { denormalized?: Record<string, { data?: Record<string, unknown> }> } };
      try {
        const roomListHeaders: Record<string, string> = {
          ...this.getAuthHeaders(),
          'X-imvu-application': 'welcome/1',
          origin: 'https://secure.imvu.com',
          referer: 'https://secure.imvu.com/',
        };
        if (cookieToSend) roomListHeaders['cookie'] = cookieToSend;
        response = await this.client.get<{ denormalized?: Record<string, { data?: Record<string, unknown> }> }>(
          url,
          { params, headers: roomListHeaders }
        );
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
          || (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error
          || (err as Error)?.message
          || String(err);
        if ((status === 403 || status === 429) && pageCount > 0 && allRooms.length > 0) {
          logger.warn(`Room list returned ${status}, stopping pagination. Collected ${allRooms.length} rooms so far.`);
          return allRooms;
        }
        throw new ImvuApiError(
          `Room list request failed${status ? ` (HTTP ${status})` : ''}: ${msg}. Use an active IMVU account in Admin → IMVU Accounts, or set IMVU_USER_ID, IMVU_AUTH_TOKEN, and IMVU_COOKIE in server .env.`,
          status ?? 500
        );
      }

      const denormalized = response.data?.denormalized || {};
      const rooms: Array<{ id: string; version: string; name?: string; description?: string; customers_id?: string; owner_id?: string }> = [];

      for (const key of Object.keys(denormalized)) {
        if (key.includes('/room/room-') && denormalized[key]?.data) {
          const match = key.match(/room-(\d+)-(\d+)/);
          if (match) {
            const roomData = denormalized[key].data!;
            rooms.push({
              id: match[1],
              version: match[2],
              name: roomData.name as string,
              description: roomData.description as string,
              customers_id: roomData.customers_id as string,
              owner_id: roomData.owner_id as string,
            });
          }
        }
      }

      if (rooms.length === 0) {
        logger.info(`Room list: page ${pageCount + 1} returned 0 rooms, stopping.`);
        break;
      }
      logger.info(`Room list: page ${pageCount + 1} returned ${rooms.length} rooms, fetching details...`);

      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        if ((i + 1) % 10 === 0 || i === 0) {
          logger.info(`Room details: ${i + 1}/${rooms.length} (page ${pageCount + 1})`);
        }
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 500));
        }
        try {
          const details = await this.getRoomDetails(room.id, room.version);
          allRooms.push({
            room_id: room.id,
            name: room.name,
            room_name: room.name,
            owner_id: room.customers_id || room.owner_id || '',
            description: room.description,
            participants: details.occupants as User[],
          });
        } catch {
          allRooms.push({
            room_id: room.id,
            name: room.name,
            room_name: room.name,
            owner_id: room.customers_id || room.owner_id || '',
            description: room.description,
            participants: [],
          });
        }
      }

      startIndex += pageSize;
      if (rooms.length < pageSize) {
        logger.info(`Room list: last page had ${rooms.length} rooms, stopping.`);
        break;
      }
      if (pageCount % 5 === 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }

    logger.info(`Room list: done. Total rooms: ${allRooms.length}`);
    return allRooms;
  }

  public async getRoomUsers(roomId: string): Promise<User[]> {
    try {
      const response = await this.client.get<User[]>(`/api/room/${roomId}/users`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch {
      const rooms = await this.getAllRooms();
      const room = rooms.find((r) => r.room_id === roomId || r.id === roomId);
      if (!room) throw new ImvuApiError(`Room ${roomId} not found`, 404);
      return room.users || room.participants || [];
    }
  }

  public async getPromotions(): Promise<Promotion[]> {
    const response = await this.client.get<Promotion[]>(
      `/api/promotions.php?cid=${this.userId}&version=2`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  public async xmlRpcCall<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    const body = this.buildXmlRpcRequest(method, params);
    const response = await this.client.post<T>('/api/xmlrpc/client.php', body, {
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'text/xml' },
    });
    return response.data;
  }

  private buildXmlRpcRequest(method: string, params: unknown[]): string {
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    let paramsXml = '';
    for (const param of params) {
      paramsXml += '<param><value>';
      if (typeof param === 'string') paramsXml += `<string>${escape(param)}</string>`;
      else if (typeof param === 'number') paramsXml += `<int>${param}</int>`;
      else if (typeof param === 'boolean') paramsXml += `<boolean>${param ? 1 : 0}</boolean>`;
      paramsXml += '</value></param>';
    }
    return `<?xml version="1.0"?><methodCall><methodName>${escape(method)}</methodName><params>${paramsXml}</params></methodCall>`;
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = (error.response?.data as { message?: string })?.message || error.message;
      if (status === 401 || status === 403) return new AuthenticationError(message);
      return new ImvuApiError(message, status);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

export default new ImvuApiClient();
