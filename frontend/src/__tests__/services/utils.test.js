import { describe, it, expect } from 'vitest';
import { getYoutubeId, getYoutubeThumbnail } from '../../services/utils';

describe('getYoutubeId', () => {
  it('extracts ID from youtube.com/watch?v= URL', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be/ URL', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/embed/ URL', () => {
    expect(getYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtube.com/v/ URL', () => {
    expect(getYoutubeId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns ID for bare 11-char string', () => {
    expect(getYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid input', () => {
    expect(getYoutubeId('not-a-youtube-url')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(getYoutubeId(null)).toBeNull();
    expect(getYoutubeId(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getYoutubeId('')).toBeNull();
  });
});

describe('getYoutubeThumbnail', () => {
  it('returns thumbnail URL for valid YouTube URL', () => {
    expect(getYoutubeThumbnail('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('returns null for invalid URL', () => {
    expect(getYoutubeThumbnail('invalid')).toBeNull();
  });

  it('returns null for null', () => {
    expect(getYoutubeThumbnail(null)).toBeNull();
  });
});
