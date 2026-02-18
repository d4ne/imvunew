import { getPrisma } from '../lib/db.js';
import logger from '../config/logger.js';
import imvuApiClient from './imvuApiClient.js';
import type { Room, User } from '../types/index.js';

let isScanning = false;
let currentScanId: string | null = null;

export interface ScanProgress {
  scanId: string;
  status: 'fetching_rooms' | 'processing_rooms' | 'saving' | 'completed';
  progress: number;
  roomsScanned: number;
  totalRooms: number;
  usersFound: number;
}

let scanProgress: ScanProgress | null = null;

/** Max time for fetching room list + details (so scan can't hang forever). */
const GET_ALL_ROOMS_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
/** Max total scan duration; after this we save partial results and complete. */
const MAX_SCAN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/** Run one full scan: fetch rooms (using scanner config filters), store Room/ImvuUser/RoomVisit. */
export async function runScan(): Promise<{ scanId: string; totalRooms: number; uniqueUsers: number } | null> {
  const db = getPrisma();
  if (!db) {
    logger.warn('Scanner: no database configured, skipping scan');
    return null;
  }
  if (isScanning) {
    logger.warn('Scanner: scan already in progress');
    return null;
  }

  isScanning = true;
  const startTime = new Date();
  let scanId: string | null = null;

  try {
    const scan = await db.scan.create({
      data: { startTime, status: 'IN_PROGRESS' },
    });
    scanId = currentScanId = scan.id;
    scanProgress = {
      scanId: scan.id,
      status: 'fetching_rooms',
      progress: 0,
      roomsScanned: 0,
      totalRooms: 0,
      usersFound: 0,
    };
    logger.info(`Scanner: starting scan ${scan.id}`);

    scanProgress.status = 'fetching_rooms';
    logger.info('Scanner: fetching room list and room details from IMVU API...');
    let rooms: Room[];
    try {
      rooms = await Promise.race([
        imvuApiClient.getAllRooms(),
        new Promise<Room[]>((_, reject) =>
          setTimeout(() => reject(new Error('getAllRooms timed out after 30 minutes')), GET_ALL_ROOMS_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      logger.error(`Scanner: getAllRooms failed or timed out: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
    logger.info(`Scanner: got ${rooms.length} rooms, processing and saving...`);
    scanProgress.totalRooms = rooms.length;
    scanProgress.status = 'processing_rooms';

    const allUsers = new Map<string, User>();
    let errorCount = 0;
    let newUserCount = 0;

    let roomsProcessed = 0;
    for (let i = 0; i < rooms.length; i++) {
      if (Date.now() - startTime.getTime() > MAX_SCAN_DURATION_MS) {
        logger.warn(`Scanner: max scan duration (${MAX_SCAN_DURATION_MS / 60000} min) reached, saving partial results.`);
        break;
      }
      const room = rooms[i];
      const imvuRoomId = room.room_id || room.id || '';
      if (!imvuRoomId) continue;

      roomsProcessed++;
      scanProgress.roomsScanned = roomsProcessed;
      scanProgress.progress = Math.floor((roomsProcessed / rooms.length) * 100);

      try {
        const dbRoom = await db.room.upsert({
          where: { roomId: imvuRoomId },
          update: {
            roomName: room.room_name || room.name,
            description: room.description ?? undefined,
            ownerId: room.owner_id ? String(room.owner_id) : undefined,
            isPublic: room.is_public ?? true,
            maxUsers: room.max_users ?? undefined,
            thumbnail: room.thumbnail ?? undefined,
            lastSeen: new Date(),
          },
          create: {
            roomId: imvuRoomId,
            roomName: room.room_name || room.name,
            description: room.description ?? undefined,
            ownerId: room.owner_id ? String(room.owner_id) : undefined,
            isPublic: room.is_public ?? true,
            maxUsers: room.max_users ?? undefined,
            thumbnail: room.thumbnail ?? undefined,
          },
        });

        const participants = room.users || room.participants || [];
        const userCids: string[] = [];

        for (const u of participants) {
          const cidRaw = u.cid ?? u.id;
          if (!cidRaw) continue;
          const cid = String(cidRaw);
          userCids.push(cid);
          const displayName = (u as { display_name?: string }).display_name ?? u.username ?? u.avatar_name ?? '';
          allUsers.set(cid, { ...u, cid, username: displayName || u.username, avatar_name: u.avatar_name });

          await db.imvuUser.upsert({
            where: { cid },
            update: {
              username: (u as { display_name?: string }).display_name ?? u.username ?? undefined,
              avatarName: u.avatar_name ?? undefined,
              avatarImage: u.avatar_image ?? undefined,
              lastSeen: new Date(),
            },
            create: {
              cid,
              username: (u as { display_name?: string }).display_name ?? u.username ?? undefined,
              avatarName: u.avatar_name ?? undefined,
              avatarImage: u.avatar_image ?? undefined,
            },
          });
        }

        const imvuUsersInRoom = await db.imvuUser.findMany({
          where: { cid: { in: userCids } },
          select: { id: true },
        });
        for (const { id: uid } of imvuUsersInRoom) {
          await db.roomVisit.upsert({
            where: {
              userId_roomId_scanId: { userId: uid, roomId: dbRoom.id, scanId: scan.id },
            },
            update: { userCount: userCids.length, seenAt: new Date() },
            create: {
              userId: uid,
              roomId: dbRoom.id,
              scanId: scan.id,
              userCount: userCids.length,
            },
          });
        }
        scanProgress.usersFound = allUsers.size;
      } catch (err) {
        errorCount++;
        logger.error(`Scanner: error processing room ${imvuRoomId}: ${err}`);
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    newUserCount = await db.imvuUser.count({
      where: { createdAt: { gte: startTime } },
    });

    await db.scan.update({
      where: { id: scan.id },
      data: {
        endTime,
        status: 'COMPLETED',
        totalRooms: rooms.length,
        roomsScanned: roomsProcessed,
        totalUsers: allUsers.size,
        uniqueUsers: allUsers.size,
        newUsers: newUserCount,
        errorCount,
        duration,
      },
    });

    scanProgress.status = 'completed';
    scanProgress.progress = 100;
    logger.info(
      `Scanner: completed ${scan.id} in ${(duration / 1000).toFixed(1)}s, rooms=${roomsProcessed}/${rooms.length}, users=${allUsers.size}, new=${newUserCount}`
    );
    return { scanId: scan.id, totalRooms: roomsProcessed, uniqueUsers: allUsers.size };
  } catch (err) {
    logger.error(`Scanner: runScan failed: ${err}`);
    if (scanId) {
      const db = getPrisma();
      if (db)
        await db.scan.update({
          where: { id: scanId },
          data: { endTime: new Date(), status: 'FAILED', errorMessage: err instanceof Error ? err.message : String(err) },
        });
    }
    return null;
  } finally {
    isScanning = false;
    currentScanId = null;
    scanProgress = null;
  }
}

export function isCurrentlyScanning(): boolean {
  return isScanning;
}

export function getScanProgress(): ScanProgress | null {
  return scanProgress;
}

/** Get user visit history by IMVU cid. */
export async function getUserHistory(cid: string) {
  const db = getPrisma();
  if (!db) return null;
  const user = await db.imvuUser.findUnique({
    where: { cid },
    include: {
      roomVisits: {
        include: { room: true, scan: true },
        orderBy: { seenAt: 'desc' },
        take: 200,
      },
    },
  });
  return user;
}

/** Resolve cid from a search term: if numeric treat as cid, else look up by username (case-insensitive). */
export async function resolveCidFromQuery(q: string): Promise<string | null> {
  const db = getPrisma();
  if (!db || !q?.trim()) return null;
  const trimmed = q.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const user = await db.imvuUser.findFirst({
    where: { username: { equals: trimmed, mode: 'insensitive' } },
    select: { cid: true },
  });
  return user?.cid ?? null;
}

/** Get user visit history by cid or username (search by username is case-insensitive). */
export async function getUserHistoryByIdentifier(q: string) {
  const cid = await resolveCidFromQuery(q);
  return cid ? getUserHistory(cid) : null;
}

/** Get scan history. */
export async function getScanHistory(limit: number = 50) {
  const db = getPrisma();
  if (!db) return [];
  return db.scan.findMany({
    take: limit,
    orderBy: { startTime: 'desc' },
    include: { _count: { select: { roomVisits: true } } },
  });
}

/** Get scanner stats (totals, recent scans, top users/rooms). */
export async function getScannerStats() {
  const db = getPrisma();
  if (!db)
    return {
      totals: { users: 0, rooms: 0, scans: 0, visits: 0 },
      recentScans: [],
      mostActiveUsers: [],
      mostPopularRooms: [],
    };
  const [totalUsers, totalRooms, totalScans, totalVisits, recentScans] = await Promise.all([
    db.imvuUser.count(),
    db.room.count(),
    db.scan.count(),
    db.roomVisit.count(),
    db.scan.findMany({
      take: 10,
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        startTime: true,
        status: true,
        totalRooms: true,
        uniqueUsers: true,
        newUsers: true,
        duration: true,
        errorMessage: true,
      },
    }),
  ]);

  const mostActiveUsers = await db.imvuUser.findMany({
    take: 10,
    orderBy: { roomVisits: { _count: 'desc' } },
    include: { _count: { select: { roomVisits: true } } },
  });
  const mostPopularRooms = await db.room.findMany({
    take: 10,
    orderBy: { roomVisits: { _count: 'desc' } },
    include: { _count: { select: { roomVisits: true } } },
  });

  return {
    totals: { users: totalUsers, rooms: totalRooms, scans: totalScans, visits: totalVisits },
    recentScans: recentScans.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      status: s.status,
      rooms: s.totalRooms,
      users: s.uniqueUsers,
      newUsers: s.newUsers,
      duration: s.duration != null ? `${(s.duration / 1000).toFixed(1)}s` : null,
      errorMessage: s.errorMessage ?? undefined,
    })),
    mostActiveUsers: mostActiveUsers.map((u) => ({
      cid: u.cid,
      username: u.username,
      visitCount: u._count.roomVisits,
      lastSeen: u.lastSeen,
    })),
    mostPopularRooms: mostPopularRooms.map((r) => ({
      roomId: r.roomId,
      roomName: r.roomName,
      visitCount: r._count.roomVisits,
      lastSeen: r.lastSeen,
    })),
  };
}
