// Reading channels/chats with GramJS (a Telegram user account, like the Telethon script it replaces).
// The account session is a string in TELEGRAM_SESSION, so no session file is needed on the server.
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { LogFn, TelegramPost, TelegramSender } from './extract';

export const DEFAULT_FIRST_DAYS = 30;
const MAX_FIRST_MESSAGES = 5000; // safety cap for a first scan of a very busy chat

export const isTelegramConfigured = () =>
  Boolean(process.env.TELEGRAM_SESSION && process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH);

export const connectTelegram = async () => {
  if (!isTelegramConfigured()) throw new Error('TELEGRAM_SESSION, TELEGRAM_API_ID and TELEGRAM_API_HASH must be set.');
  const client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION),
    Number(process.env.TELEGRAM_API_ID),
    String(process.env.TELEGRAM_API_HASH),
    { connectionRetries: 5 }
  );
  client.setLogLevel('error' as any);
  await client.connect();
  if (!(await client.isUserAuthorized())) {
    await client.disconnect();
    throw new Error('The Telegram session is not authorized: log in again and update TELEGRAM_SESSION.');
  }
  return client;
};

const describeSender = (sender: unknown): TelegramSender | null => {
  if (sender instanceof Api.User) {
    return {
      type: 'user',
      id: sender.id.toString(),
      username: sender.username || sender.usernames?.[0]?.username || null,
      name: [sender.firstName, sender.lastName].filter(Boolean).join(' ') || null,
      phone: sender.phone ? `+${sender.phone}` : null,
      bot: Boolean(sender.bot)
    };
  }
  if (sender instanceof Api.Channel) {
    return { type: 'channel', id: sender.id.toString(), username: sender.username || null, name: sender.title };
  }
  return sender ? { type: 'unknown' } : null;
};

/**
 * New posts of one channel since lastId (or, on the first scan, for the last `days` days).
 * A Telegram album is several messages with one groupedId: they are merged into one post with all photo ids.
 */
export const collectChannel = async (
  client: TelegramClient,
  channel: string,
  lastId: number,
  days: number,
  log: LogFn
): Promise<{ posts: TelegramPost[]; lastId: number }> => {
  const since = lastId ? 0 : Math.floor(Date.now() / 1000) - days * 86_400;
  log(lastId ? `@${channel}: reading after message ${lastId} ...` : `@${channel}: first scan, last ${days} days ...`);
  const messages: Api.Message[] = [];
  for await (const message of client.iterMessages(channel, { minId: lastId, limit: lastId ? undefined : MAX_FIRST_MESSAGES })) {
    if (!(message instanceof Api.Message)) continue;
    if (since && message.date < since) break;
    messages.push(message);
  }
  if (!messages.length) return { posts: [], lastId };
  messages.reverse();

  const groups = new Map<string, Api.Message[]>();
  for (const message of messages) {
    const groupKey = message.groupedId ? `g${message.groupedId.toString()}` : `m${message.id}`;
    groups.set(groupKey, [...(groups.get(groupKey) || []), message]);
  }

  const posts: TelegramPost[] = [];
  for (const parts of groups.values()) {
    const main = parts.find(part => (part.message || '').trim()) || parts[0];
    const text = parts.map(part => (part.message || '').trim()).filter(Boolean).join('\n');
    const photoIds = parts.filter(part => part.photo).map(part => part.id);
    if (!text && !photoIds.length) continue;
    posts.push({
      key: `${channel}-${main.id}`,
      channel,
      messageId: main.id,
      messageIds: parts.map(part => part.id),
      photoIds,
      date: new Date(main.date * 1000).toISOString(),
      text,
      sender: describeSender(await main.getSender().catch(() => undefined)),
      url: `https://t.me/${channel}/${main.id}`
    });
  }
  const newLastId = Math.max(...messages.map(message => message.id));
  log(`  new posts: ${posts.length}, photos: ${posts.reduce((sum, post) => sum + post.photoIds.length, 0)}, last id ${newLastId}`);
  return { posts, lastId: newLastId };
};

// Photos are downloaded only for listings that go to the site, straight from Telegram.
export const downloadPhotos = async (client: TelegramClient, channel: string, ids: number[]) => {
  if (!ids.length) return [];
  const messages = await client.getMessages(channel, { ids });
  const files: Array<{ id: number; buffer: Buffer }> = [];
  for (const message of messages) {
    if (!(message instanceof Api.Message) || !message.photo) continue;
    const buffer = await client.downloadMedia(message, {});
    if (Buffer.isBuffer(buffer) && buffer.length) files.push({ id: message.id, buffer });
  }
  return files;
};
