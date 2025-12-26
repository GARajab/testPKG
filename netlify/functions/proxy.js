const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { pkgUrl } = JSON.parse(event.body);

        if (!pkgUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Package URL is required' })
            };
        }

        // Get file size and headers
        const response = await fetch(pkgUrl, { method: 'HEAD' });

        if (!response.ok) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Cannot access URL: ${response.statusText}` })
            };
        }

        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        // Extract filename from URL
        const filename = pkgUrl.split('/').pop() || 'game.pkg';

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                size: parseInt(contentLength) || 0,
                filename: filename,
                contentType: contentType || 'application/octet-stream',
                url: pkgUrl
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};