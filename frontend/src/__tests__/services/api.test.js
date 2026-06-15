import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../services/api';

const mockJson = vi.fn();
const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  mockJson.mockReset();
  localStorage.clear();
});

function mockResponse(data, ok = true) {
  mockJson.mockResolvedValue(data);
  mockFetch.mockResolvedValue({ ok, json: mockJson });
}

describe('api.login', () => {
  it('sends POST with username and password', async () => {
    mockResponse({ token: 'abc', username: 'admin' });
    const result = await api.login('admin', 'pass123');
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'pass123' }),
    }));
    expect(result.token).toBe('abc');
  });
});

describe('api.verifyToken', () => {
  it('sends GET with token header', async () => {
    localStorage.setItem('admin_token', 'test-token');
    mockResponse({ valid: true, username: 'admin' });
    const result = await api.verifyToken();
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/verify', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }));
    expect(result.valid).toBe(true);
  });
});

describe('api.getTheaters', () => {
  it('returns theater list', async () => {
    const theaters = [{ id: '1', name: 'T1' }];
    mockResponse(theaters);
    const result = await api.getTheaters();
    expect(result).toEqual(theaters);
  });
});

describe('api.createTheater', () => {
  it('sends POST with theater data', async () => {
    mockResponse({ id: '1', name: 'New Theater' });
    const result = await api.createTheater({ name: 'New Theater', location: 'Here' });
    expect(mockFetch).toHaveBeenCalledWith('/api/theaters', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'New Theater', location: 'Here' }),
    }));
    expect(result.name).toBe('New Theater');
  });
});

describe('api.deleteTheater', () => {
  it('sends DELETE', async () => {
    mockResponse({ success: true });
    const result = await api.deleteTheater('th1');
    expect(mockFetch).toHaveBeenCalledWith('/api/theaters/th1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});

describe('api.getShowBySlug', () => {
  it('sends GET with slug', async () => {
    mockResponse({ id: 'sh1', slug: 'abc123' });
    const result = await api.getShowBySlug('abc123');
    expect(mockFetch).toHaveBeenCalledWith('/api/shows/slug/abc123', expect.anything());
    expect(result.id).toBe('sh1');
  });
});

describe('api.createBooking', () => {
  it('sends POST with booking data', async () => {
    mockResponse({ id: 'bk1' });
    const data = { showId: 'sh1', seats: ['A1'], customerName: 'John', mobile: '123' };
    const result = await api.createBooking(data);
    expect(mockFetch).toHaveBeenCalledWith('/api/bookings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(data),
    }));
  });
});

describe('api.getStats', () => {
  it('returns stats', async () => {
    mockResponse({ totalShows: 5, totalRevenue: 1000 });
    const result = await api.getStats();
    expect(result.totalShows).toBe(5);
  });
});

describe('error handling', () => {
  it('throws error for failed requests', async () => {
    mockJson.mockResolvedValue({ error: 'Not found' });
    mockFetch.mockResolvedValue({ ok: false, json: mockJson, status: 404 });
    await expect(api.getTheater('nonexistent')).rejects.toThrow('Not found');
  });

  it('throws generic error when no error message in response', async () => {
    mockJson.mockResolvedValue({});
    mockFetch.mockResolvedValue({ ok: false, json: mockJson, status: 500 });
    await expect(api.getTheater('x')).rejects.toThrow('Request failed: 500');
  });
});
