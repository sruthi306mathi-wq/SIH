import { Response } from 'express';

interface Client {
  userId: string;
  res: Response;
}

const clients: Map<string, Set<Response>> = new Map();

export function addClient(userId: string, res: Response) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);

  res.on('close', () => {
    const userSet = clients.get(userId);
    if (userSet) {
      userSet.delete(res);
      if (userSet.size === 0) {
        clients.delete(userId);
      }
    }
  });
}

export function broadcastToUser(userId: string, eventName: string, data: any) {
  const userSet = clients.get(userId);
  if (userSet) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    userSet.forEach((res) => {
      try {
        res.write(payload);
      } catch (e) {
        console.error('SSE write error', e);
      }
    });
  }
}

export function broadcastToAll(eventName: string, data: any) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((userSet) => {
    userSet.forEach((res) => {
      try {
        res.write(payload);
      } catch (e) {
        console.error('SSE write error', e);
      }
    });
  });
}
