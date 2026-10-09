import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { broadcastToUser } from '../events';

export const chatRouter = Router();

// GET USER'S CONVERSATIONS
chatRouter.get('/conversations', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const convs = db.prepare(`
      SELECT c.*,
        u1.full_name as u1_name, u1.avatar_url as u1_avatar,
        u2.full_name as u2_name, u2.avatar_url as u2_avatar
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
    `).all(user.id, user.id) as any[];

    const formatted = convs.map(c => {
      const isU1 = c.user1_id === user.id;
      const otherUserId = isU1 ? c.user2_id : c.user1_id;
      const otherUserName = isU1 ? c.u2_name : c.u1_name;
      const otherUserAvatar = isU1 ? c.u2_avatar : c.u1_avatar;

      // Latest message
      const lastMsg = db.prepare(`
        SELECT content, created_at, sender_id, is_read
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC LIMIT 1
      `).get(c.id) as any;

      // Unread count
      const unread = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE conversation_id = ? AND receiver_id = ? AND is_read = 0
      `).get(c.id, user.id) as { count: number };

      return {
        id: c.id,
        otherUserId,
        otherUserName,
        otherUserAvatar,
        lastMessage: lastMsg?.content || 'Conversation started',
        lastMessageAt: lastMsg?.created_at || c.created_at,
        unreadCount: unread.count
      };
    });

    res.json({ conversations: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// GET MESSAGES IN CONVERSATION
chatRouter.get('/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const convId = req.params.id;

    // Verify membership
    const conv = db.prepare('SELECT user1_id, user2_id FROM conversations WHERE id = ?').get(convId) as any;
    if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
      res.status(403).json({ error: 'Not authorized for this conversation.' });
      return;
    }

    // Mark unread messages as read
    db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND receiver_id = ?').run(convId, user.id);

    const msgs = db.prepare(`
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(convId);

    res.json({ messages: msgs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// SEND MESSAGE
chatRouter.post('/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const convId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    const conv = db.prepare('SELECT user1_id, user2_id FROM conversations WHERE id = ?').get(convId) as any;
    if (!conv || (conv.user1_id !== user.id && conv.user2_id !== user.id)) {
      res.status(403).json({ error: 'Not authorized for this conversation.' });
      return;
    }

    const receiverId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const msgId = 'msg_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(msgId, convId, user.id, receiverId, content.trim(), now);

    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(now, convId);

    const newMsg = {
      id: msgId,
      conversation_id: convId,
      sender_id: user.id,
      sender_name: user.full_name,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: now,
      is_read: 0
    };

    // Real-time broadcast to receiver via SSE
    broadcastToUser(receiverId, 'NEW_CHAT_MESSAGE', newMsg);

    res.status(201).json({ message: newMsg });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});
