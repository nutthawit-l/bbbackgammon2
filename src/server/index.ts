import { Hono } from 'hono';

type Bindings = {
  GAME_ROOM: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/api/rooms', async (c) => {
  const id = c.env.GAME_ROOM.newUniqueId();
  return c.json({ roomId: id.toString() });
});

app.get('/ws/room/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  let id: DurableObjectId;
  try {
    id = c.env.GAME_ROOM.idFromString(roomId);
  } catch {
    return c.json({ error: 'Invalid room ID' });
  }
  const room = c.env.GAME_ROOM.get(id);
  return room.fetch(c.req.raw);
});

export default app;
export { GameRoom } from './GameRoom';
