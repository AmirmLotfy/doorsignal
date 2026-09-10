import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { AppError, type RecordItem } from './types';

export type Write = { item: RecordItem; expectedVersion: number | null; delete?: boolean };
export interface Store {
  get<T>(pk: string, sk: string): Promise<RecordItem<T> | undefined>;
  list<T>(pk: string, prefix: string): Promise<RecordItem<T>[]>;
  transact(writes: Write[]): Promise<void>;
}
const alive = (item: RecordItem) => item.expiresAt > Math.floor(Date.now() / 1000);
export function item<T>(pk: string, sk: string, data: T, previousVersion = 0, days = pk.startsWith('judge:') ? 1 : 7): RecordItem<T> {
  return { pk, sk, data, version: previousVersion + 1, expiresAt: Math.floor(Date.now() / 1000 + days * 86400) };
}

/** Durable development adapter. Atomic rename plus an inter-process lock; never used on Lambda. */
export class FileStore implements Store {
  constructor(public filename: string) {}
  private async read(): Promise<Record<string, RecordItem>> {
    try { return JSON.parse(await readFile(this.filename, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw error; }
  }
  async get<T>(pk: string, sk: string) {
    const record = (await this.read())[`${pk}|${sk}`] as RecordItem<T> | undefined;
    return record && alive(record) ? record : undefined;
  }
  async list<T>(pk: string, prefix: string) {
    return Object.values(await this.read()).filter(x => x.pk === pk && x.sk.startsWith(prefix) && alive(x)) as RecordItem<T>[];
  }
  async transact(writes: Write[]) {
    await mkdir(path.dirname(this.filename), { recursive: true });
    const lock = `${this.filename}.lock`;
    const deadline = Date.now() + 5000;
    while (true) {
      try { await mkdir(lock); break; }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const modified = await stat(lock).catch(() => undefined);
        if (modified && Date.now() - modified.mtimeMs > 30000) await rm(lock, { recursive: true, force: true });
        if (Date.now() > deadline) throw new AppError(503, 'Storage is busy. Please retry.');
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    try {
      const records = await this.read();
      for (const write of writes) {
        const key = `${write.item.pk}|${write.item.sk}`;
        const current = records[key];
        if (write.expectedVersion === null ? current && alive(current) : current?.version !== write.expectedVersion)
          throw new AppError(409, 'This record changed. Refresh and try again.');
      }
      for (const write of writes) {
        const key = `${write.item.pk}|${write.item.sk}`;
        if (write.delete) delete records[key]; else records[key] = write.item;
      }
      for (const [key, value] of Object.entries(records)) if (!alive(value)) delete records[key];
      const temp = `${this.filename}.${randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(records), { mode: 0o600 });
      await rename(temp, this.filename);
    } finally { await rm(lock, { recursive: true, force: true }); }
  }
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1', maxAttempts: 2 }), { marshallOptions: { removeUndefinedValues: true } });
export class DynamoStore implements Store {
  constructor(public tableName: string) {}
  async get<T>(pk: string, sk: string) {
    const { Item } = await ddb.send(new GetCommand({ TableName: this.tableName, Key: { pk, sk }, ConsistentRead: true }));
    return Item && alive(Item as RecordItem) ? Item as RecordItem<T> : undefined;
  }
  async list<T>(pk: string, prefix: string) {
    const results: RecordItem<T>[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const page = await ddb.send(new QueryCommand({ TableName: this.tableName, ConsistentRead: true,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix }, ExclusiveStartKey: cursor }));
      results.push(...(page.Items || []).filter(x => alive(x as RecordItem)) as RecordItem<T>[]);
      cursor = page.LastEvaluatedKey;
      if (results.length > 5000) throw new AppError(429, 'Please reduce the requested data window.');
    } while (cursor);
    return results;
  }
  async transact(writes: Write[]) {
    if (!writes.length) return;
    if (writes.length > 100) throw new AppError(400, 'Too many transaction items.');
    try {
      await ddb.send(new TransactWriteCommand({ TransactItems: writes.map(write => {
        const condition = write.expectedVersion === null ? 'attribute_not_exists(pk) OR expiresAt <= :now' : '#v = :version';
        const common = { TableName: this.tableName, ConditionExpression: condition,
          ExpressionAttributeNames: write.expectedVersion === null ? undefined : { '#v': 'version' },
          ExpressionAttributeValues: write.expectedVersion === null ? { ':now': Math.floor(Date.now() / 1000) } : { ':version': write.expectedVersion } };
        return write.delete ? { Delete: { ...common, Key: { pk: write.item.pk, sk: write.item.sk } } } : { Put: { ...common, Item: write.item } };
      }) }));
    } catch (error) {
      if ((error as { name?: string }).name === 'TransactionCanceledException')
        throw new AppError(409, 'This record changed. Refresh and try again.');
      throw error;
    }
  }
}
let singleton: Store | undefined;
export function getStore(): Store {
  if (!singleton) {
    if (process.env.DOORSIGNAL_TABLE) singleton = new DynamoStore(process.env.DOORSIGNAL_TABLE);
    else if (process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('DOORSIGNAL_TABLE is required on Lambda.');
    else singleton = new FileStore(process.env.DOORSIGNAL_DATA_FILE || path.resolve(process.cwd(), '.data/doorsignal.json'));
  }
  return singleton;
}
export async function limit(store: Store, scope: string, key: string, max: number, windowSeconds = 86400) {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const sk = `limit:${key}:${bucket}`;
  for (let attempt = 0; attempt < 12; attempt++) {
    const current = await store.get<{ count: number }>(scope, sk);
    if ((current?.data.count || 0) >= max) throw new AppError(429, 'The usage allowance is reached. Please try again later.');
    try {
      await store.transact([{ item: { ...item(scope, sk, { count: (current?.data.count || 0) + 1 }, current?.version), expiresAt: (bucket + 2) * windowSeconds }, expectedVersion: current?.version ?? null }]);
      return;
    } catch (error) {
      if (!(error instanceof AppError && error.status === 409)) throw error;
      // Concurrent dashboard reads can arrive in the same millisecond. A
      // growing jitter prevents every optimistic retry from colliding again.
      await new Promise(resolve => setTimeout(resolve, 8 * (attempt + 1) + Math.floor(Math.random() * 16)));
    }
  }
  throw new AppError(503, 'Usage accounting is busy. Please retry.');
}
