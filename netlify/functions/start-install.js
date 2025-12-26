// netlify/functions/start-install.js
const DualRequestInstaller = require('./install');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { pcIp, ps4Ip, pkgName, pkgSize } = JSON.parse(event.body);

        const installer = new DualRequestInstaller(pcIp, ps4Ip, pkgName);
        installer.pkgSize = pkgSize || 0;

        const payload = installer.patchPayload();
        const metadata = installer.generateMetadata();

        if (!payload) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to generate payload' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Installation data generated',
                payload: payload,
                metadata: metadata,
                callbackPort: installer.callbackPort,
                instructions: [
                    '1. Save the payload to your computer',
                    '2. Use a payload sender to send it to your PS4',
                    '3. Make sure your callback server is running on port 9022',
                    '4. The PS4 will connect to get the package metadata'
                ]
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};