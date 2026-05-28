import type { Track } from '../types';

export const DEFAULT_API_KEY = 'AIzaSyCuHboaVwoiAI75nERPSL7PaXCJMBWEyu4';

export function getApiKey(): string {
  const savedKey = localStorage.getItem('yt_music_api_key');
  return savedKey || DEFAULT_API_KEY;
}

export function saveApiKey(key: string) {
  if (key) {
    localStorage.setItem('yt_music_api_key', key);
  } else {
    localStorage.removeItem('yt_music_api_key');
  }
}

// Extract playlist ID from YouTube URLs
export function extractPlaylistId(url: string): string | null {
  const reg = /[?&]list=([^#\&\?]+)/;
  const match = url.match(reg);
  if (match && match[1]) {
    return match[1];
  }
  // Try to match if they pasted the raw ID
  if (url.startsWith('PL') && url.length >= 18) {
    return url;
  }
  return null;
}

// Extract video ID from YouTube URLs (in case they want to import a single song via URL)
export function extractVideoId(url: string): string | null {
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(reg);
  return match ? match[1] : null;
}

// Clean YouTube titles (remove official video text, audio tags, etc. for cleaner music app view)
export function cleanTitle(title: string): string {
  return title
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\[Official Music Video\]/gi, '')
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\[Official Video\]/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[Official Audio\]/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .replace(/\[Lyrics\]/gi, '')
    .replace(/\(Lyrics\)/gi, '')
    .replace(/\(Official Lyric Video\)/gi, '')
    .replace(/\[Official Lyric Video\]/gi, '')
    .replace(/HD/gi, '')
    .replace(/4K/gi, '')
    .replace(/\s\s+/g, ' ')
    .trim();
}

// Search YouTube videos using v3 search API
export async function searchYouTube(query: string, apiKey: string = getApiKey()): Promise<Track[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query + ' audio'
    )}&type=video&maxResults=20&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Failed to fetch search results from YouTube');
    }

    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: cleanTitle(item.snippet.title),
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    // Fallback to public Invidious API instance if the YouTube API key quota is hit or errors
    return searchInvidiousFallback(query);
  }
}

// Fallback search using Invidious API
async function searchInvidiousFallback(query: string): Promise<Track[]> {
  const instances = [
    'https://invidious.flokinet.to',
    'https://iv.melmac.space',
    'https://yewtu.be',
    'https://invidious.projectsegfau.lt'
  ];
  
  // Try instances sequentially
  for (const instance of instances) {
    try {
      const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.slice(0, 20).map((item: any) => ({
            id: item.videoId,
            title: cleanTitle(item.title),
            channelTitle: item.author,
            thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
          }));
        }
      }
    } catch (e) {
      console.warn(`Invidious instance ${instance} failed, trying next...`, e);
    }
  }
  return [];
}

// Fetch YouTube items in a playlist
export async function fetchYouTubePlaylist(playlistId: string, apiKey: string = getApiKey()): Promise<Track[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Failed to fetch YouTube playlist');
    }

    const data = await res.json();
    if (!data.items) return [];

    return data.items
      .filter((item: any) => item.snippet?.resourceId?.videoId)
      .map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: cleanTitle(item.snippet.title),
        channelTitle: item.snippet.channelTitle || item.snippet.videoOwnerChannelTitle || 'YouTube Playlist Item',
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
      }));
  } catch (error) {
    console.error('YouTube playlist fetch error:', error);
    throw error;
  }
}

// Get suggestion songs based on preferences
export async function getSuggestions(
  languages: string[],
  apiKey: string = getApiKey()
): Promise<Track[]> {
  if (languages.length === 0) {
    return searchYouTube('popular songs', apiKey);
  }

  // Choose a random language to keep suggestions fresh
  const selectedLang = languages[Math.floor(Math.random() * languages.length)] || '';
  const query = `${selectedLang} popular music hits`.trim();

  return searchYouTube(query, apiKey);
}
