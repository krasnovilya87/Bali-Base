import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';

process.env.NODE_ENV = 'production';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'bali-base-90ca8';

const { rateLimit, requireAppCheck } = await import('../src/server/security');

const createResponse = () => {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;
  const response = {
    locals: { authUser: { uid: 'server-security-test-user' } },
    setHeader: (name: string, value: string) => headers.set(name, value),
    status: (status: number) => {
      statusCode = status;
      return response;
    },
    json: (value: unknown) => {
      body = value;
      return response;
    }
  } as unknown as Response;

  return {
    response,
    read: () => ({ headers, statusCode, body })
  };
};

const appCheckResponse = createResponse();
await new Promise<void>((resolve, reject) => {
  const next: NextFunction = error => error ? reject(error) : resolve();
  Promise.resolve(requireAppCheck({ header: () => undefined } as unknown as Request, appCheckResponse.response, next))
    .then(resolve, reject);
});
assert.equal(appCheckResponse.read().statusCode, 401);
console.log('PASS: production API rejects requests without App Check');

const limiter = rateLimit({
  scope: `server-security-test-${Date.now()}`,
  windowMs: 60_000,
  max: 2
});

const invokeLimiter = async () => {
  const target = createResponse();
  let nextCalled = false;
  await new Promise<void>((resolve, reject) => {
    const next: NextFunction = error => {
      if (error) reject(error);
      else {
        nextCalled = true;
        resolve();
      }
    };
    limiter({ socket: { remoteAddress: '127.0.0.1' } } as unknown as Request, target.response, next);
    const waitForResponse = () => {
      if (nextCalled || target.read().statusCode !== 200) resolve();
      else setTimeout(waitForResponse, 10);
    };
    waitForResponse();
  });
  return { nextCalled, ...target.read() };
};

assert.equal((await invokeLimiter()).nextCalled, true);
assert.equal((await invokeLimiter()).nextCalled, true);
const rejected = await invokeLimiter();
assert.equal(rejected.nextCalled, false);
assert.equal(rejected.statusCode, 429);
console.log('PASS: durable Firestore rate limit rejects requests above the shared limit');
