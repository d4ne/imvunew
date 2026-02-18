import { Request, Response } from 'express';
import imvuApiClient from '../services/imvuApiClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { User } from '../types/index.js';

export const getRooms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const offset = parseInt((req.query.offset as string) || '0', 10);
  const decode = req.query.decode !== 'false';
  const rooms = await imvuApiClient.getRoomsList(offset, decode);
  res.status(200).json({ success: true, data: rooms, pagination: { offset, limit: 24 } });
});

export const getAllRooms = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const rooms = await imvuApiClient.getAllRooms();
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

export const getRoomUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roomId } = req.params;
  const users = await imvuApiClient.getRoomUsers(roomId);
  res.status(200).json({ success: true, roomId, count: users.length, data: users });
});

export const getAllRoomUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const rooms = await imvuApiClient.getAllRooms();
  const allUsers: User[] = [];
  const roomsWithUsers: Array<{ roomId: string; roomName: string; userCount: number; users: User[] }> = [];

  for (const room of rooms) {
    const rid = room.room_id || room.id || '';
    const users = room.users || room.participants || [];
    if (users.length > 0) {
      roomsWithUsers.push({
        roomId: rid,
        roomName: room.name || room.room_name || '',
        userCount: users.length,
        users,
      });
      allUsers.push(...users);
    }
  }

  const unique = Array.from(new Map(allUsers.map((u) => [u.cid || u.id, u])).values());

  res.status(200).json({
    success: true,
    data: {
      totalRooms: rooms.length,
      roomsWithUsers: roomsWithUsers.length,
      totalUsers: allUsers.length,
      uniqueUsers: unique.length,
      rooms: roomsWithUsers,
      allUsers: unique,
    },
  });
});

export const searchRooms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await imvuApiClient.getRoomsList(0, true);
  const name = (req.query.name as string)?.toLowerCase();
  const minUsers = req.query.minUsers ? Number(req.query.minUsers) : undefined;
  const maxUsers = req.query.maxUsers ? Number(req.query.maxUsers) : undefined;

  let rooms = data.rooms || [];

  if (name) {
    rooms = rooms.filter(
      (r) => (r.name || r.room_name || '').toLowerCase().includes(name)
    );
  }
  if (minUsers != null) {
    rooms = rooms.filter((r) => (r.user_count ?? 0) >= minUsers);
  }
  if (maxUsers != null) {
    rooms = rooms.filter((r) => (r.user_count ?? 0) <= maxUsers);
  }

  res.status(200).json({ success: true, data: { rooms, total: rooms.length } });
});
