import express from 'express';
import {
  getRooms,
  getAllRooms,
  getRoomUsers,
  getAllRoomUsers,
  searchRooms,
} from '../controllers/roomsController.js';
import { validateQuery, validateParams } from '../middleware/requestValidator.js';
import { roomSearchSchema, roomIdParamSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/all', getAllRooms);
router.get('/search', validateQuery(roomSearchSchema), searchRooms);
router.get('/users/all', getAllRoomUsers);
router.get('/:roomId/users', validateParams(roomIdParamSchema), getRoomUsers);

export default router;
