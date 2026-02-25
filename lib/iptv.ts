import { parse } from 'iptv-playlist-parser';
import axios from 'axios';

export interface Channel {
  name: string;
  tvg: {
    id: string;
    name: string;
    logo: string;
    url: string;
    rec: string;
  };
  group: {
    title: string;
  };
  http: {
    referrer: string;
    'user-agent': string;
  };
  url: string;
  raw: string;
}

export interface Playlist {
  items: Channel[];
}

export const parseM3U = (content: string): Playlist => {
  const result = parse(content);
  return result as Playlist;
};

export const fetchM3U = async (url: string, headers?: Record<string, string>): Promise<Playlist> => {
  // Use proxy to bypass CORS
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const config = {
    responseType: 'text' as const, // Force text response
    headers: {
      // Use a standard browser UA to avoid being blocked by some providers that dislike IPTV players
      'X-User-Agent': headers?.['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-Referer': headers?.['Referer'] || undefined,
    }
  };
  
  try {
    const response = await axios.get(proxyUrl, config);
    const content = response.data;

    if (typeof content !== 'string') {
       throw new Error('Received invalid response format (not a string).');
    }

    // Check for common error signatures in the content
    if (content.includes('403 Forbidden') || content.includes('Access Denied') || content.includes('Error 884')) {
       throw new Error('Provider blocked the request (Access Denied/Forbidden).');
    }

    if (!content.trim().startsWith('#EXTM3U')) {
       // It might be a raw text without header, or HTML error page
       if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
          throw new Error('Received HTML instead of M3U playlist. The provider might be blocking the request.');
       }
       // Attempt to parse anyway, some lists are malformed
    }

    const playlist = parseM3U(content);
    if (!playlist.items || playlist.items.length === 0) {
       throw new Error('Playlist is empty or invalid.');
    }
    return playlist;
  } catch (error: any) {
    if (error.response?.data?.details) {
       throw new Error(`Proxy Error: ${error.response.data.details}`);
    }
    throw error;
  }
};

export interface XtreamLoginResponse {
  user_info: {
    username: string;
    password: string;
    message: string;
    auth: number;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
    timezone_name: string;
  };
}

export const xtreamLogin = async (url: string, username: string, password: string): Promise<XtreamLoginResponse> => {
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const loginUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
  // Try direct first, then proxy if fails (Xtream often supports CORS, but not always)
  try {
    const response = await axios.get(loginUrl);
    return response.data;
  } catch (e) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(loginUrl)}`;
    const config = {
      headers: {
        'X-User-Agent': 'IPTV Smarters Pro',
      }
    };
    const response = await axios.get(proxyUrl, config);
    return response.data;
  }
};
