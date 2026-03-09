import express, { Request, Response } from 'express';
import cors from 'cors';
import { sha256Pad } from '@zk-email/helpers/dist/sha-utils';
const snarkjs = require('snarkjs');
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 8080;
const MAX_MSG_LEN = 1024;
const MAX_PAYLOAD_BYTES = 768;
const N = 121n;
const K = 17;

const RAPIDSNARK_PATH = path.join(__dirname, '../build/rapidsnark');
const ZKEY_PATH = path.join(__dirname, '../build/jwt_verify_final.zkey');
const WASM_PATH = path.join(__dirname, '../build/jwt_verify_js/jwt_verify.wasm');

const USE_RAPIDSNARK = fs.existsSync(RAPIDSNARK_PATH);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function splitToChunks(value: bigint, n: bigint, k: number): string[] {
    const chunks: string[] = [];
    let val = value;
    const mask = (1n << n) - 1n;
    for (let i = 0; i < k; i++) {
        chunks.push((val & mask).toString());
        val >>= n;
    }
    return chunks;
}

function findClaimPos(decoded: string, key: string): { pos: number; len: number } {
    const strPattern = `"${key}":"`;
    const strIdx = decoded.indexOf(strPattern);
    if (strIdx !== -1) {
        const valueStart = strIdx + strPattern.length;
        const valueEnd = decoded.indexOf('"', valueStart);
        return { pos: valueStart, len: valueEnd - valueStart };
    }
    const numPattern = `"${key}":`;
    const numIdx = decoded.indexOf(numPattern);
    if (numIdx === -1) throw new Error(`Claim "${key}" not found in JWT payload`);
    const valueStart = numIdx + numPattern.length;
    let end = decoded.indexOf(',', valueStart);
    if (end === -1) end = decoded.indexOf('}', valueStart);
    return { pos: valueStart, len: end - valueStart };
}

async function proveWithRapidsnark(inputs: any): Promise<{ proof: any; publicSignals: string[] }> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerebro-'));
    const inputPath = path.join(tmpDir, 'input.json');
    const witnessPath = path.join(tmpDir, 'witness.wtns');
    const proofPath = path.join(tmpDir, 'proof.json');
    const publicPath = path.join(tmpDir, 'public.json');

    try {
        // 1. Generate witness with snarkjs
        fs.writeFileSync(inputPath, JSON.stringify(inputs));
        const { wtns } = snarkjs;
        await wtns.calculate(inputs, WASM_PATH, witnessPath);

        // 2. Generate proof with rapidsnark (native, much faster)
        execSync(`${RAPIDSNARK_PATH} ${ZKEY_PATH} ${witnessPath} ${proofPath} ${publicPath}`, {
            timeout: 60000,
        });

        const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
        const publicSignals = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
        return { proof, publicSignals };
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

async function proveWithSnarkjs(inputs: any): Promise<{ proof: any; publicSignals: string[] }> {
    return snarkjs.groth16.fullProve(inputs, WASM_PATH, ZKEY_PATH);
}

app.post('/prove', async (req: Request, res: Response): Promise<any> => {
    try {
        const { jwt, modulus } = req.body;
        if (!jwt) return res.status(400).json({ error: "Missing 'jwt'" });
        if (!modulus) return res.status(400).json({ error: "Missing 'modulus'" });

        const parts = jwt.split('.');
        if (parts.length !== 3) return res.status(400).json({ error: "Invalid JWT structure" });

        // Decode payload for validation
        const payloadB64 = parts[1];
        const decodedPayload = Buffer.from(payloadB64, 'base64url');
        const decodedStr = decodedPayload.toString('utf-8');
        const payload = JSON.parse(decodedStr);

        // Validate JWT expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return res.status(400).json({
                error: "JWT expired",
                exp: payload.exp,
                now,
                expiredAgo: `${now - payload.exp}s`,
            });
        }

        // Validate required claims exist
        for (const claim of ['sub', 'iss', 'aud', 'nonce', 'exp']) {
            if (!(claim in payload)) {
                return res.status(400).json({ error: `Missing required claim: ${claim}` });
            }
        }

        console.log(`[+] Proving JWT | iss: ${payload.iss} | exp: ${new Date(payload.exp * 1000).toISOString()}`);

        // Message preparation
        const signedMessage = `${parts[0]}.${parts[1]}`;
        const signedMessageBuffer = Buffer.from(signedMessage, 'utf-8');
        if (signedMessageBuffer.byteLength > MAX_MSG_LEN - 64) {
            return res.status(400).json({ error: "JWT too large" });
        }

        const [paddedMessage, messageLen] = sha256Pad(signedMessageBuffer, MAX_MSG_LEN);

        // RSA chunks
        const sigBuffer = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
        const sigBigInt = BigInt('0x' + sigBuffer.toString('hex'));
        const modBigInt = BigInt(modulus);

        // Claim positions
        const payloadStart = parts[0].length + 1;
        const subClaim = findClaimPos(decodedStr, 'sub');
        const nonceClaim = findClaimPos(decodedStr, 'nonce');
        const issClaim = findClaimPos(decodedStr, 'iss');
        const audClaim = findClaimPos(decodedStr, 'aud');
        const expClaim = findClaimPos(decodedStr, 'exp');

        // Decoded payload array
        const decodedPayloadArr = new Array(MAX_PAYLOAD_BYTES).fill('0');
        for (let i = 0; i < decodedPayload.length; i++) {
            decodedPayloadArr[i] = decodedPayload[i].toString();
        }

        const messageArr = Array.from(signedMessageBuffer).map(x => x.toString());
        while (messageArr.length < MAX_MSG_LEN) messageArr.push('0');

        const inputs = {
            message: messageArr,
            message_padded: Array.from(paddedMessage).map((x: number) => x.toString()),
            message_len: messageLen.toString(),
            signature: splitToChunks(sigBigInt, N, K),
            pubkey: splitToChunks(modBigInt, N, K),
            payload_start: payloadStart.toString(),
            payload_b64_len: payloadB64.length.toString(),
            decoded_payload: decodedPayloadArr,
            decoded_payload_len: decodedPayload.length.toString(),
            sub_pos: subClaim.pos.toString(),
            sub_len: subClaim.len.toString(),
            nonce_pos: nonceClaim.pos.toString(),
            nonce_len: nonceClaim.len.toString(),
            iss_pos: issClaim.pos.toString(),
            iss_len: issClaim.len.toString(),
            aud_pos: audClaim.pos.toString(),
            aud_len: audClaim.len.toString(),
            exp_pos: expClaim.pos.toString(),
            exp_len: expClaim.len.toString(),
        };

        // Generate proof
        const proverName = USE_RAPIDSNARK ? 'rapidsnark' : 'snarkjs';
        console.log(`[+] Generating proof with ${proverName}...`);
        const t0 = Date.now();

        const { proof, publicSignals } = USE_RAPIDSNARK
            ? await proveWithRapidsnark(inputs)
            : await proveWithSnarkjs(inputs);

        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`[+] Proof generated in ${elapsed}s (${proverName})`);
        console.log(`[+] pubkey_hash: ${publicSignals[0]}`);
        console.log(`[+] sub_hash:    ${publicSignals[1]}`);
        console.log(`[+] exp:         ${publicSignals[5]}`);

        return res.json({
            success: true,
            proof,
            publicSignals,
            claims: {
                pubkey_hash: publicSignals[0],
                sub_hash: publicSignals[1],
                nonce_hash: publicSignals[2],
                iss_hash: publicSignals[3],
                aud_hash: publicSignals[4],
                exp: publicSignals[5],
            },
            prover: proverName,
            provingTimeSeconds: parseFloat(elapsed),
        });

    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ error: "Internal prover error", details: e.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`[+] Cerebro Prover active on port ${PORT}`);
    console.log(`[+] Prover backend: ${USE_RAPIDSNARK ? 'rapidsnark (native)' : 'snarkjs (JS)'}`);
});
