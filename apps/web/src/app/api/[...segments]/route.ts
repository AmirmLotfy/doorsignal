import { handleRequest } from '@doorsignal/core/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleRequest(request);
export const POST = (request: Request) => handleRequest(request);
export const PUT = (request: Request) => handleRequest(request);
export const DELETE = (request: Request) => handleRequest(request);
