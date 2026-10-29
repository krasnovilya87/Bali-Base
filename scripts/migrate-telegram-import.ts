// One-off move of the old file-based Telegram import (Data/маркет/telegramm) into Firestore, so the server
// import continues from the same point: channels, last scanned messages, collected posts, Gemini answers and
// what is already on the site. Nothing is sent to Gemini again.
//   npx tsx scripts/migrate-telegram-import.ts [--apply]
import '../src/server/env';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { TelegramPost } from '../src/server/telegramImport/extract';
import {
  saveChannelEntries,
  saveChannelState,
  savePass,
  savePosts,
  saveUploaded,
  type ChannelEntry,
  type UploadedEntry
} from '../src/server/telegramImport/store';

const SOURCE = path.resolve(process.cwd(), '../../../Data/маркет/telegramm');
const OUT = path.join(SOURCE, 'out');
const apply = process.argv.includes('--apply');

const readJson = <T>(file: string, fallback: T): T => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);
const readJsonl = (file: string) => (existsSync(file)
  ? readFileSync(file, 'utf8').split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
  : []);

const channels: ChannelEntry[] = readJson<Array<string | ChannelEntry>>(path.join(SOURCE, 'channels.json'), [])
  .map(entry => (typeof entry === 'string' ? { name: entry } : entry));
const states = readJson<Record<string, { last_id: number; posts: number }>>(path.join(OUT, 'state.json'), {});

const posts: TelegramPost[] = [];
for (const file of readdirSync(path.join(OUT, 'raw')).filter(name => name.endsWith('.jsonl'))) {
  for (const raw of readJsonl(path.join(OUT, 'raw', file))) {
    const photoIds = (raw.photos as string[]).map(photo => Number(photo.match(/_(\d+)\.jpg$/)?.[1])).filter(Boolean);
    posts.push({
      key: `${raw.channel}-${raw.message_id}`,
      channel: raw.channel,
      messageId: raw.message_id,
      messageIds: raw.message_ids || [raw.message_id],
      photoIds,
      date: new Date(raw.date).toISOString(),
      text: raw.text || '',
      sender: raw.sender ? { ...raw.sender, id: raw.sender.id ? String(raw.sender.id) : undefined } : null,
      url: raw.url
    });
  }
}

// Later lines of the Gemini caches override earlier ones (answers asked again).
const lastValues = (file: string) => Object.fromEntries(readJsonl(file).map(row => [row.key, row.value]));
const pass1 = lastValues(path.join(OUT, 'pass1.jsonl'));
const pass2 = lastValues(path.join(OUT, 'pass2.jsonl'));
const uploaded = Object.fromEntries(Object.entries(readJson<Record<string, UploadedEntry>>(path.join(OUT, 'uploaded.json'), {}))
  .map(([listingId, entry]) => [listingId.replace(/^tg-/, ''), entry]));

console.log(`channels ${channels.length}, posts ${posts.length}, pass1 ${Object.keys(pass1).length}, `
  + `pass2 ${Object.keys(pass2).length}, uploaded ${Object.keys(uploaded).length}`);
if (!apply) {
  console.log('DRY RUN: add --apply to write to Firestore.');
  process.exit(0);
}

await saveChannelEntries(channels);
for (const [name, state] of Object.entries(states)) await saveChannelState(name, { lastId: state.last_id, posts: state.posts });
await savePosts(posts);
await savePass('pass1', pass1);
await savePass('pass2', pass2);
await saveUploaded(uploaded);
console.log('WRITTEN to Firestore: telegram_import, telegram_posts');
process.exit(0);
