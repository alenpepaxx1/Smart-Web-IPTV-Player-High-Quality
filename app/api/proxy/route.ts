import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': req.headers.get('x-user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': req.headers.get('x-referer') || undefined,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      validateStatus: (status) => {
        return status < 500 || status === 884; // Accept 884 to pass it through if possible, or handle it
      }
    });

    const contentType = response.headers['content-type'];
    
    // If upstream returns 884, we should probably return 403 or 502 to client with details
    if (response.status === 884) {
       console.error('Upstream returned 884 (Blocked/Forbidden)');
       return NextResponse.json({ 
         error: 'Provider blocked the request (Status 884)', 
         details: 'The IPTV provider blocked the connection. Try using a VPN or different network.',
         upstreamStatus: 884
       }, { status: 403 });
    }

    return new NextResponse(response.data, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error.message);
    if (error.response) {
      console.error('Upstream status:', error.response.status);
      console.error('Upstream headers:', error.response.headers);
      // console.error('Upstream data:', error.response.data.toString()); // Careful with binary data
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch resource', 
      details: error.message,
      upstreamStatus: error.response?.status 
    }, { status: 502 });
  }
}
