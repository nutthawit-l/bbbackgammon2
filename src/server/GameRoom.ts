import { DurableObject } from 'cloudflare:workers';

interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

export class GameRoom extends DurableObject<Env> {
  private connections = new Set<WebSocket>();
  private players = new Map<WebSocket, 'white' | 'red'>();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (this.players.size >= 2) {
      return new Response('Room full', { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    server.accept();
    this.connections.add(server);

    // Assign color: first player gets random, second gets the opposite.
    const takenColors = [...this.players.values()];
    const color: 'white' | 'red' =
      takenColors.length === 0
        ? Math.random() > 0.5
          ? 'white'
          : 'red'
        : takenColors[0] === 'white'
          ? 'red'
          : 'white';

    this.players.set(server, color);

    server.send(JSON.stringify({ type: 'connected', color }));

    // If room is now full, broadcast game_start to all.
    if (this.players.size === 2) {
      this.broadcast(JSON.stringify({ type: 'game_start' }));
    }

    server.addEventListener('close', () => {
      this.connections.delete(server);
      this.players.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(message: string) {
    for (const conn of this.connections) {
      conn.send(message);
    }
  }
}
