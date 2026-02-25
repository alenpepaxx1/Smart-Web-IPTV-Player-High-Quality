import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

// Helper to create a Stalker-compatible Axios instance
const createStalkerClient = (mac: string, portalUrl: string, token?: string, customReferer?: string) => {
  // Use customReferer if provided, otherwise try to derive it
  let referer = customReferer || portalUrl;
  
  // If no custom referer and portalUrl points to load.php, strip it to find base
  if (!customReferer && referer.includes('/server/load.php')) {
    referer = referer.split('/server/load.php')[0] + '/';
  }

  const headers: any = {
    'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
    'Referer': referer,
    'Cookie': `mac=${encodeURIComponent(mac)}; stb_lang=en; timezone=Europe/London;${token ? ` stoke=${token};` : ''}`,
    'X-User-Agent': 'Model: MAG250; Link: WiFi',
    'Content-Type': 'application/x-www-form-urlencoded',
    'JsHttpRequest': '1-xml',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return axios.create({
    headers,
    timeout: 15000,
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });
};

// Helper to generate candidate URLs with appropriate Referers
const generateCandidateUrls = (inputUrl: string): { url: string, referer: string }[] => {
  let baseUrl = inputUrl;
  // Remove trailing slash
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const candidates: { url: string, referer: string }[] = [];

  // Helper to add candidate if not duplicate
  const addCandidate = (url: string, referer: string) => {
    // Avoid double slashes (except protocol)
    const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
    const cleanReferer = referer.replace(/([^:]\/)\/+/g, "$1");
    
    // Check for duplicates
    if (!candidates.some(c => c.url === cleanUrl)) {
        candidates.push({ url: cleanUrl, referer: cleanReferer });
    }
  };

  // 0. If user provided full load.php, prioritize it
  if (baseUrl.includes('load.php')) {
    // Guess referer: parent dir
    const ref = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    addCandidate(baseUrl, ref);

    // Extract root for other attempts
    if (baseUrl.includes('/server/load.php')) {
      baseUrl = baseUrl.split('/server/load.php')[0];
    } else {
       // Fallback: strip last segment
       baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
    }
  }

  // 1. As-is + standard suffixes
  // For .../c/server/load.php, referer is .../c/
  addCandidate(`${baseUrl}/server/load.php`, `${baseUrl}/`);
  addCandidate(`${baseUrl}/c/server/load.php`, `${baseUrl}/c/`);
  addCandidate(`${baseUrl}/portal/server/load.php`, `${baseUrl}/portal/`);
  addCandidate(`${baseUrl}/stalker_portal/server/load.php`, `${baseUrl}/stalker_portal/c/`); // Try /c/ inside stalker_portal
  addCandidate(`${baseUrl}/stalker_portal/server/load.php`, `${baseUrl}/stalker_portal/`);   // Try root inside stalker_portal
  addCandidate(`${baseUrl}/mag/server/load.php`, `${baseUrl}/mag/`);
  addCandidate(`${baseUrl}/ministra/server/load.php`, `${baseUrl}/ministra/`);

  // 2. "Walk up" the path segments
  try {
    const urlObj = new URL(baseUrl);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    // Try removing segments from the end one by one
    while (pathSegments.length > 0) {
      pathSegments.pop();
      const currentPath = pathSegments.join('/');
      const currentBase = `${urlObj.protocol}//${urlObj.host}${currentPath ? '/' + currentPath : ''}`;
      
      addCandidate(`${currentBase}/server/load.php`, `${currentBase}/`);
      addCandidate(`${currentBase}/c/server/load.php`, `${currentBase}/c/`);
      addCandidate(`${currentBase}/portal/server/load.php`, `${currentBase}/portal/`);
      addCandidate(`${currentBase}/stalker_portal/server/load.php`, `${currentBase}/stalker_portal/c/`);
    }
  } catch (e) {
    // Ignore invalid URLs
  }

  // 3. Try root URL (protocol + host + port) explicitly
  try {
    // Ensure URL has protocol
    if (!baseUrl.startsWith('http')) {
      baseUrl = `http://${baseUrl}`;
    }
    const urlObj = new URL(baseUrl);
    const rootUrl = `${urlObj.protocol}//${urlObj.host}`;
    if (rootUrl !== baseUrl) {
        addCandidate(`${rootUrl}/server/load.php`, `${rootUrl}/`);
        addCandidate(`${rootUrl}/c/server/load.php`, `${rootUrl}/c/`);
        addCandidate(`${rootUrl}/portal/server/load.php`, `${rootUrl}/portal/`);
        addCandidate(`${rootUrl}/stalker_portal/server/load.php`, `${rootUrl}/stalker_portal/c/`);
        addCandidate(`${rootUrl}/mag/server/load.php`, `${rootUrl}/mag/`);
    }
  } catch (e) {
    // ignore invalid URLs
  }

  return candidates;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const mac = searchParams.get('mac');
  const url = searchParams.get('url');
  
  if (!action || !mac || !url) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Define apiUrl here to be accessible in catch block
  let apiUrl = url;

  try {
    if (action === 'handshake') {
      const candidates = generateCandidateUrls(url);
      let lastError: any = null;

      console.log(`[Stalker] Probing candidates for ${url}:`, candidates);

      for (const candidate of candidates) {
        try {
          console.log(`[Stalker] Trying handshake: ${candidate.url} (Ref: ${candidate.referer})`);
          // Use candidateUrl for the client creation to ensure Referer matches the probed URL
          const client = createStalkerClient(mac, candidate.url, undefined, candidate.referer); 
          
          const response = await client.get(candidate.url, {
            params: {
              type: 'stb',
              action: 'handshake',
              token: '',
              mac: mac,
              deviceId: mac,
              deviceId2: mac,
              signature: '',
            }
          });

          // Check if we got a valid JSON response with token or at least valid structure
          if (response.data && response.data.js) {
            console.log(`[Stalker] Handshake success at: ${candidate.url}`);
            return NextResponse.json({
              ...response.data,
              real_url: candidate.url // Return the working URL
            });
          }
        } catch (err: any) {
          console.log(`[Stalker] Failed at ${candidate.url}: ${err.message}`);
          
          // If 403, it might be a session cookie issue. Try to "prime" the session by hitting the portal root.
          if (err.response?.status === 403) {
             console.log('[Stalker] 403 Forbidden. Attempting to prime session cookies...');
             try {
               // Try to GET the referer URL (usually the portal index) to get cookies
               const primeResponse = await axios.get(candidate.referer, {
                 timeout: 5000,
                 headers: {
                   'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
                 },
                 httpsAgent: new https.Agent({ rejectUnauthorized: false })
               });
               
               const setCookie = primeResponse.headers['set-cookie'];
               
               if (setCookie) {
                 console.log('[Stalker] Got cookies from prime request:', setCookie);
                 // Retry handshake with new cookies
                 const cookieStr = setCookie.map((c: string) => c.split(';')[0]).join('; ');
                 
                 // Create a new client with the extra cookies
                 const retryClient = createStalkerClient(mac, candidate.url, undefined, candidate.referer);
                 retryClient.defaults.headers['Cookie'] += `; ${cookieStr}`;
                 
                 const retryResponse = await retryClient.get(candidate.url, {
                    params: {
                      type: 'stb',
                      action: 'handshake',
                      token: '',
                      mac: mac,
                      deviceId: mac,
                      deviceId2: mac,
                      signature: '',
                    }
                 });
                 
                 if (retryResponse.data && retryResponse.data.js) {
                    console.log(`[Stalker] Retry handshake success at: ${candidate.url}`);
                    return NextResponse.json({
                      ...retryResponse.data,
                      real_url: candidate.url
                    });
                 }
               }
             } catch (primeErr: any) {
               console.log('[Stalker] Session priming failed:', primeErr.message);
             }
          }
          
          lastError = err;
          // Continue to next candidate
        }
      }
      
      // If all failed
      throw lastError || new Error('All candidate URLs failed');
    }

    // For other actions, we expect 'url' to be the correct API URL (passed back from handshake)
    // But we still apply the basic check just in case it's a raw portal URL
    if (!apiUrl.includes('load.php')) {
       // Fallback to simple append if client didn't update URL, 
       // but ideally client should send the real_url from handshake.
       // We'll use the first candidate logic for consistency if needed, 
       // but let's assume client sends correct one.
       if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
       if (apiUrl.endsWith('/c')) apiUrl += '/server/load.php';
       else apiUrl += '/server/load.php';
    }

    if (action === 'get_profile') {
      const token = searchParams.get('token');
      if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

      const client = createStalkerClient(mac, url, token);
      const response = await client.get(apiUrl, {
        params: {
          type: 'stb',
          action: 'get_profile',
          hd: 1,
          ver: 'ImageDescription: 0.2.18-r14-250; ImageDate: Fri Jan 15 15:20:44 EET 2016; PORTAL version: 5.1.0; API Version: JS',
          stb_type: 'MAG250',
          sn: '0000000000000',
        }
      });

      return NextResponse.json(response.data);
    }

    if (action === 'get_channels') {
      const token = searchParams.get('token');
      if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

      const client = createStalkerClient(mac, url, token);
      const response = await client.get(apiUrl, {
        params: {
          type: 'itv',
          action: 'get_all_channels',
          force_ch_link_check: 0,
        }
      });

      return NextResponse.json(response.data);
    }

    if (action === 'create_link') {
      const token = searchParams.get('token');
      const cmd = searchParams.get('cmd');
      if (!token || !cmd) return NextResponse.json({ error: 'Token and cmd required' }, { status: 400 });

      const client = createStalkerClient(mac, url, token);
      try {
        const response = await client.get(apiUrl, {
          params: {
            type: 'itv',
            action: 'create_link',
            cmd: cmd,
            series_number: 0,
            forced_storage: 0,
            disable_ad: 0,
            download: 0,
            force_ch_link_check: 0,
          }
        });

        // Stalker returns "cmd" in the response which is the URL
        // Sometimes it's in data.cmd, sometimes data.js.cmd
        const streamUrl = response.data?.cmd || response.data?.js?.cmd;
        
        if (streamUrl) {
          // If it's a redirect, we might want to return it directly or proxy it
          // For now, return the URL so the frontend can play it
          return NextResponse.json({ url: streamUrl });
        } else {
          console.error('[Stalker] create_link failed. Response:', response.data);
          
          // Fallback: If cmd looks like a URL, try using it directly
          if (cmd.startsWith('http') || cmd.startsWith('rtmp') || cmd.startsWith('rtsp')) {
             console.log('[Stalker] Falling back to raw cmd URL:', cmd);
             return NextResponse.json({ url: cmd });
          }

          // Handle specific 'link_fault' error which often means the stream is offline or requires a different request type
          if (response.data === 'link_fault' || response.data?.error === 'link_fault' || response.data?.js?.error === 'link_fault') {
             return NextResponse.json({ error: 'Stream unavailable (link_fault)' }, { status: 503 });
          }

          return NextResponse.json({ 
            error: 'Failed to generate link', 
            details: response.data 
          }, { status: 500 });
        }
      } catch (err: any) {
        console.error('[Stalker] create_link error:', err.message);
        throw err;
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error(`[Stalker] API Error for ${apiUrl}:`, error.message);
    if (error.response) {
      console.error('[Stalker] Response status:', error.response.status);
      console.error('[Stalker] Response data:', error.response.data);
      return NextResponse.json({ 
        error: `Stalker API request failed: ${error.message}`, 
        details: error.response.data 
      }, { status: error.response.status || 500 });
    }
    return NextResponse.json({ error: `Stalker API request failed: ${error.message}` }, { status: 500 });
  }
}
