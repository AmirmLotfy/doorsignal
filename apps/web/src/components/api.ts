export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
  return data;
}
