export interface ImvuConfig {
  baseUrl: string;
  userId: string;
  authToken: string;
  cookie?: string;
  version: string;
  os: string;
}

export interface ServerConfig {
  port: number;
  env: string;
}

export interface LoggingConfig {
  level: string;
}

export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendUrl: string;
  /** Guild (server) ID to check member roles. If set with accessRoleId, login requires this role. */
  guildId?: string;
  /** Role ID required to log in (e.g. "access" role). Application must be in the guild (bot invited). */
  accessRoleId?: string;
  /** Role ID for admin access (e.g. admin-only pages and blacklist). Requires guildId; requests guilds.members.read. */
  adminRoleId?: string;
  /** Optional Discord webhook URL to post when a user logs in (e.g. for notifications). */
  loginWebhookUrl?: string;
}

export interface JwtConfig {
  secret: string;
  cookieName: string;
  maxAge: number;
}

export interface DatabaseConfig {
  url: string;
}

export interface AppConfig {
  server: ServerConfig;
  imvu: ImvuConfig;
  logging: LoggingConfig;
  discord: DiscordConfig;
  jwt: JwtConfig;
  database?: DatabaseConfig;
}

export interface ImvuApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
}

export interface Room {
  room_id?: string;
  id?: string;
  room_name?: string;
  name?: string;
  description?: string;
  user_count?: number;
  max_users?: number;
  users?: User[];
  participants?: User[];
  owner_id?: string;
  created_at?: string;
  is_public?: boolean;
  tags?: string[];
  thumbnail?: string;
}

export interface RoomsList {
  rooms: Room[];
  total?: number;
  offset?: number;
  limit?: number;
  has_more?: boolean;
}

export interface RoomSearchQuery {
  name?: string;
  minUsers?: number;
  maxUsers?: number;
  isPublic?: boolean;
  tags?: string[];
}

export interface User {
  cid?: string;
  id?: string;
  username?: string;
  avatar_name?: string;
  display_name?: string;
  registered?: string;
  gender?: string;
  age?: number;
  location?: string;
  avatar_image?: string;
  is_online?: boolean;
  is_vip?: boolean;
  is_ap?: boolean;
  last_login?: string;
  profile_url?: string;
}

export interface AvatarCard {
  cid: string;
  username: string;
  avatar_name: string;
  registered: string;
  gender: string;
  age: number;
  location: string;
  avatar_image: string;
  profile_pic: string;
  is_online: boolean;
  is_vip: boolean;
  is_ap: boolean;
  last_login: string;
  about_me?: string;
  interests?: string[];
  badges?: Badge[];
  stats?: AvatarStats;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  earned_at: string;
}

export interface AvatarStats {
  friends_count: number;
  visits_count: number;
  credits: number;
  level: number;
}

export interface AvatarAction {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  is_available: boolean;
}

export interface LoginCredentials {
  userId: string;
  authToken: string;
}

export interface LoginConfig {
  version: string;
  required_version?: string;
  maintenance_mode?: boolean;
  message?: string;
  features?: Record<string, boolean>;
}

export interface BatchAvatarRequest {
  cids: string[];
}

export interface BatchAvatarResult {
  cid: string;
  success: boolean;
  data?: AvatarCard;
  error?: string;
}

export interface AllRoomUsersResponse {
  totalRooms: number;
  roomsWithUsers: number;
  totalUsers: number;
  uniqueUsers: number;
  rooms: Array<{
    roomId: string;
    roomName: string;
    userCount: number;
    users: User[];
  }>;
  allUsers: User[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  type: string;
}

export class ImvuApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ImvuApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends ImvuApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ImvuApiError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ImvuApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ImvuApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export interface JwtPayload {
  sub: string;
  username: string;
  avatar?: string;
  discriminator?: string;
  tier: 'free' | 'plus' | 'premium';
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}
