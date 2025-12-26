// netlify/functions/install.js
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

class DualRequestInstaller {
    constructor(pcIp, ps4Ip, pkgName) {
        // These will come from user input
        this.pcIp = pcIp;
        this.ps4Ip = ps4Ip;
        this.pkgName = pkgName;
        this.callbackPort = 9022;
        this.npxPort = 8080;
        this.pkgUrl = `http://${this.pcIp}:${this.npxPort}/pkgs/${this.pkgName}`;
    }

    generateMetadata() {
        const contentId = "EP3464-CUSA12140_00-PETOONS201800001";
        const bgftType = "gd";

        const urlData = Buffer.from(this.pkgUrl, "utf-8");
        const nameData = Buffer.from(this.pkgName, "utf-8");
        const idData = Buffer.from(contentId, "utf-8");
        const typeData = Buffer.from(bgftType, "utf-8");

        const packet = Buffer.alloc(
            4 + 4 + urlData.length +
            4 + nameData.length +
            4 + idData.length +
            4 + typeData.length +
            8 + 4
        );

        let o = 0;
        packet.writeUInt32LE(1, o); o += 4;
        packet.writeUInt32LE(urlData.length, o); o += 4; urlData.copy(packet, o); o += urlData.length;
        packet.writeUInt32LE(nameData.length, o); o += 4; nameData.copy(packet, o); o += nameData.length;
        packet.writeUInt32LE(idData.length, o); o += 4; idData.copy(packet, o); o += idData.length;
        packet.writeUInt32LE(typeData.length, o); o += 4; typeData.copy(packet, o); o += typeData.length;
        packet.writeBigUInt64LE(BigInt(this.pkgSize || 0), o); o += 8;
        packet.writeUInt32LE(0, o);

        return packet.toString('base64');
    }

    patchPayload() {
        // In Netlify, we'll provide the payload file statically
        const payloadPath = path.join(__dirname, '..', 'public', 'payload.bin');

        try {
            const payload = fs.readFileSync(payloadPath);
            const placeholder = Buffer.from([0xB4, 0xB4, 0xB4, 0xB4, 0xB4, 0xB4]);
            const offset = payload.indexOf(placeholder);

            if (offset === -1) {
                throw new Error("Placeholder not found in payload");
            }

            const ipBytes = Buffer.from(this.pcIp.split(".").map(Number));
            const portBytes = Buffer.alloc(2);
            portBytes.writeUInt16BE(this.callbackPort);

            ipBytes.copy(payload, offset);
            portBytes.copy(payload, offset + 4);

            return payload.toString('base64');
        } catch (e) {
            console.error(`Patch error: ${e.message}`);
            return null;
        }
    }
}

module.exports = DualRequestInstaller;