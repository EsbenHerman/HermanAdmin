export const API_BASE = '/api/v1'

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
    throw new Error(error.error ?? 'Request failed')
  }
  return response.json() as Promise<T>
}
