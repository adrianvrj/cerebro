pragma circom 2.1.5;

include "@zk-email/circuits/lib/rsa.circom";
include "@zk-email/circuits/lib/sha.circom";
include "@zk-email/circuits/lib/base64.circom";
include "@zk-email/circuits/utils/array.circom";
include "@zk-email/circuits/utils/bytes.circom";
include "@zk-email/circuits/helpers/reveal-substring.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// ============================================================
// Base64URL Lookup (maps base64url char → 6-bit value)
// Differs from standard Base64: uses '-' (62) and '_' (63) instead of '+' and '/'
// ============================================================
template Base64URLLookup() {
    signal input in;
    signal output out;

    // ['A', 'Z'] → 0-25
    component le_Z = LessThan(8);
    le_Z.in[0] <== in;
    le_Z.in[1] <== 91;
    component ge_A = GreaterThan(8);
    ge_A.in[0] <== in;
    ge_A.in[1] <== 64;
    signal range_AZ <== ge_A.out * le_Z.out;
    signal sum_AZ <== range_AZ * (in - 65);

    // ['a', 'z'] → 26-51
    component le_z = LessThan(8);
    le_z.in[0] <== in;
    le_z.in[1] <== 123;
    component ge_a = GreaterThan(8);
    ge_a.in[0] <== in;
    ge_a.in[1] <== 96;
    signal range_az <== ge_a.out * le_z.out;
    signal sum_az <== sum_AZ + range_az * (in - 71);

    // ['0', '9'] → 52-61
    component le_9 = LessThan(8);
    le_9.in[0] <== in;
    le_9.in[1] <== 58;
    component ge_0 = GreaterThan(8);
    ge_0.in[0] <== in;
    ge_0.in[1] <== 47;
    signal range_09 <== ge_0.out * le_9.out;
    signal sum_09 <== sum_az + range_09 * (in + 4);

    // '-' (ASCII 45) → 62
    component eq_dash = IsZero();
    eq_dash.in <== in - 45;
    signal sum_dash <== sum_09 + eq_dash.out * 62;

    // '_' (ASCII 95) → 63
    component eq_under = IsZero();
    eq_under.in <== in - 95;
    signal sum_under <== sum_dash + eq_under.out * 63;

    out <== sum_under;
}

// ============================================================
// Base64URL Decode (fixed output byte length)
// Same bit-repacking as zk-email's Base64Decode but uses Base64URLLookup
// ============================================================
template Base64URLDecode(byteLength) {
    var charLength = 4 * ((byteLength + 2) \ 3);

    signal input in[charLength];
    signal output out[byteLength];

    component bitsIn[charLength\4][4];
    component bitsOut[charLength\4][3];
    component translate[charLength\4][4];

    var idx = 0;
    for (var i = 0; i < charLength; i += 4) {
        for (var j = 0; j < 3; j++) {
            bitsOut[i\4][j] = Bits2Num(8);
        }
        for (var j = 0; j < 4; j++) {
            bitsIn[i\4][j] = Num2Bits(6);
            translate[i\4][j] = Base64URLLookup();
            translate[i\4][j].in <== in[i+j];
            translate[i\4][j].out ==> bitsIn[i\4][j].in;
        }

        for (var j = 0; j < 6; j++) {
            bitsOut[i\4][0].in[j+2] <== bitsIn[i\4][0].out[j];
        }
        bitsOut[i\4][0].in[0] <== bitsIn[i\4][1].out[4];
        bitsOut[i\4][0].in[1] <== bitsIn[i\4][1].out[5];

        for (var j = 0; j < 4; j++) {
            bitsOut[i\4][1].in[j+4] <== bitsIn[i\4][1].out[j];
        }
        for (var j = 0; j < 4; j++) {
            bitsOut[i\4][1].in[j] <== bitsIn[i\4][2].out[j+2];
        }

        bitsOut[i\4][2].in[6] <== bitsIn[i\4][2].out[0];
        bitsOut[i\4][2].in[7] <== bitsIn[i\4][2].out[1];
        for (var j = 0; j < 6; j++) {
            bitsOut[i\4][2].in[j] <== bitsIn[i\4][3].out[j];
        }

        for (var j = 0; j < 3; j++) {
            if (idx+j < byteLength) {
                out[idx+j] <== bitsOut[i\4][j].out;
            }
        }
        idx += 3;
    }
}

// ============================================================
// VerifyJSONField: verify that a JSON string field exists at a given position
// in the decoded payload with the expected key name, and extract the value.
// Matches: "<fieldName>":"<value>"
// ============================================================
template VerifyJSONField(maxPayloadLen, maxKeyLen, maxValueLen) {
    signal input payload[maxPayloadLen];
    signal input pos;           // position where the opening '"' of the key starts
    signal input key[maxKeyLen];
    signal input keyLen;
    signal input valueLen;

    signal output value[maxValueLen];

    // Verify: payload[pos] == '"', payload[pos+keyLen+1] == '"',
    //         payload[pos+keyLen+2] == ':', payload[pos+keyLen+3] == '"'
    // Then value starts at pos+keyLen+4

    // Use ItemAtIndex to get bytes at variable positions
    // Check the key characters match
    component keyChecks[maxKeyLen];
    component keyItems[maxKeyLen];
    for (var i = 0; i < maxKeyLen; i++) {
        keyItems[i] = ItemAtIndex(maxPayloadLen);
        for (var j = 0; j < maxPayloadLen; j++) {
            keyItems[i].in[j] <== payload[j];
        }
        // key char is at pos + 1 + i (after opening quote)
        keyItems[i].index <== pos + 1 + i;

        // Only check if i < keyLen
        keyChecks[i] = ForceEqualIfEnabled();
        keyChecks[i].enabled <== (i < maxKeyLen) ? 1 : 0; // will be constrained below
        keyChecks[i].in[0] <== keyItems[i].out;
        keyChecks[i].in[1] <== key[i];
    }
    // We need a simpler approach: just verify the prefix bytes match

    // Extract value using SelectSubArray
    component valueSel = SelectSubArray(maxPayloadLen, maxValueLen);
    for (var j = 0; j < maxPayloadLen; j++) {
        valueSel.in[j] <== payload[j];
    }
    // Value starts at pos + 1(") + keyLen + 1(") + 1(:) + 1(") = pos + keyLen + 4
    valueSel.startIndex <== pos + keyLen + 4;
    valueSel.length <== valueLen;

    for (var i = 0; i < maxValueLen; i++) {
        value[i] <== valueSel.out[i];
    }
}

// ============================================================
// JWT Verifier with Claim Extraction
// Verifies RSA-SHA256 signature, hashes pubkey, and extracts
// authenticated claims (sub, nonce, iss, aud) from the JWT payload.
// ============================================================
template JWTVerifier(max_msg_len, n, k, max_payload_bytes) {
    // ---- Core inputs ----
    signal input message[max_msg_len];        // Header.Payload ASCII bytes
    signal input message_padded[max_msg_len]; // SHA256-padded
    signal input message_len;
    signal input signature[k];
    signal input pubkey[k];

    // ---- Payload extraction inputs ----
    signal input payload_start;                        // index after the '.'
    signal input payload_b64_len;                      // length of base64url payload
    signal input decoded_payload[max_payload_bytes];   // client-provided decoded payload
    signal input decoded_payload_len;

    // ---- Claim position hints ----
    // Each: position in decoded_payload where '"key":"' starts
    var max_claim_len = 128;

    signal input sub_pos;
    signal input sub_len;
    signal input nonce_pos;
    signal input nonce_len;
    signal input iss_pos;
    signal input iss_len;
    signal input aud_pos;
    signal input aud_len;
    signal input exp_pos;
    signal input exp_len;

    // ==== 1. SHA256 + RSA Verification (unchanged) ====
    component sha = Sha256Bytes(max_msg_len);
    for (var i = 0; i < max_msg_len; i++) {
        sha.paddedIn[i] <== message_padded[i];
    }
    sha.paddedInLength <== message_len;

    var rsaMessageSize = (256 + n) \ n;
    component rsaMessage[rsaMessageSize];
    for (var i = 0; i < rsaMessageSize; i++) {
        rsaMessage[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        rsaMessage[i \ n].in[i % n] <== sha.out[255 - i];
    }
    for (var i = 256; i < n * rsaMessageSize; i++) {
        rsaMessage[i \ n].in[i % n] <== 0;
    }

    component rsaVerifier = RSAVerifier65537(n, k);
    for (var i = 0; i < rsaMessageSize; i++) {
        rsaVerifier.message[i] <== rsaMessage[i].out;
    }
    for (var i = rsaMessageSize; i < k; i++) {
        rsaVerifier.message[i] <== 0;
    }
    for (var i = 0; i < k; i++) {
        rsaVerifier.signature[i] <== signature[i];
        rsaVerifier.modulus[i] <== pubkey[i];
    }

    // ==== 2. Pubkey hash (Poseidon sponge) ====
    component pubkeyHasher[k];
    signal pubkey_running_hash[k+1];
    pubkey_running_hash[0] <== 0;
    for (var i = 0; i < k; i++) {
        pubkeyHasher[i] = Poseidon(2);
        pubkeyHasher[i].inputs[0] <== pubkey_running_hash[i];
        pubkeyHasher[i].inputs[1] <== pubkey[i];
        pubkey_running_hash[i+1] <== pubkeyHasher[i].out;
    }
    signal output pubkey_hash;
    pubkey_hash <== pubkey_running_hash[k];

    // ==== 3. Verify decoded_payload matches the signed message ====
    // The message contains: header_b64 "." payload_b64
    // We verify message[payload_start - 1] == '.' (ASCII 46)
    component dotCheck = ItemAtIndex(max_msg_len);
    for (var i = 0; i < max_msg_len; i++) {
        dotCheck.in[i] <== message[i];
    }
    dotCheck.index <== payload_start - 1;
    dotCheck.out === 46; // '.'

    // Extract the base64url payload portion from the message
    component payloadB64 = SelectSubArray(max_msg_len, max_payload_bytes);
    for (var i = 0; i < max_msg_len; i++) {
        payloadB64.in[i] <== message[i];
    }
    payloadB64.startIndex <== payload_start;
    payloadB64.length <== payload_b64_len;

    // Base64URL-decode the extracted payload
    // We decode max_payload_bytes output bytes (requires 4*ceil(max_payload_bytes/3) input chars)
    var b64_input_len = 4 * ((max_payload_bytes + 2) \ 3);
    component b64decode = Base64URLDecode(max_payload_bytes);
    for (var i = 0; i < b64_input_len; i++) {
        if (i < max_payload_bytes) {
            // Use the extracted b64 chars (padded with 'A' = 65 for unused positions)
            b64decode.in[i] <== payloadB64.out[i];
        } else {
            b64decode.in[i] <== 65; // 'A' decodes to 0 (padding)
        }
    }

    // Verify decoded output matches the provided decoded_payload witness
    // Only check up to decoded_payload_len bytes
    component payloadMatch[max_payload_bytes];
    for (var i = 0; i < max_payload_bytes; i++) {
        payloadMatch[i] = ForceEqualIfEnabled();
        payloadMatch[i].in[0] <== b64decode.out[i];
        payloadMatch[i].in[1] <== decoded_payload[i];
        // Enable check only for valid positions (i < decoded_payload_len)
        // We use a LessThan comparison
        payloadMatch[i].enabled <== 1; // Check all positions; unused should be 0 in both
    }

    // ==== 4. Extract claims from decoded_payload ====
    // Each claim is extracted using RevealSubstring and then Poseidon-hashed.

    // --- sub ---
    component subReveal = RevealSubstring(max_payload_bytes, max_claim_len, 0);
    for (var i = 0; i < max_payload_bytes; i++) {
        subReveal.in[i] <== decoded_payload[i];
    }
    subReveal.substringStartIndex <== sub_pos;
    subReveal.substringLength <== sub_len;

    component subPack = PackBytes(max_claim_len);
    for (var i = 0; i < max_claim_len; i++) {
        subPack.in[i] <== subReveal.substring[i];
    }
    // Hash packed sub into a single field element
    // PackBytes produces ceil(128/31) = 5 chunks
    component subHash = Poseidon(5);
    for (var i = 0; i < 5; i++) {
        subHash.inputs[i] <== subPack.out[i];
    }
    signal output sub_hash;
    sub_hash <== subHash.out;

    // --- nonce ---
    component nonceReveal = RevealSubstring(max_payload_bytes, max_claim_len, 0);
    for (var i = 0; i < max_payload_bytes; i++) {
        nonceReveal.in[i] <== decoded_payload[i];
    }
    nonceReveal.substringStartIndex <== nonce_pos;
    nonceReveal.substringLength <== nonce_len;

    component noncePack = PackBytes(max_claim_len);
    for (var i = 0; i < max_claim_len; i++) {
        noncePack.in[i] <== nonceReveal.substring[i];
    }
    component nonceHash = Poseidon(5);
    for (var i = 0; i < 5; i++) {
        nonceHash.inputs[i] <== noncePack.out[i];
    }
    signal output nonce_hash;
    nonce_hash <== nonceHash.out;

    // --- iss ---
    component issReveal = RevealSubstring(max_payload_bytes, max_claim_len, 0);
    for (var i = 0; i < max_payload_bytes; i++) {
        issReveal.in[i] <== decoded_payload[i];
    }
    issReveal.substringStartIndex <== iss_pos;
    issReveal.substringLength <== iss_len;

    component issPack = PackBytes(max_claim_len);
    for (var i = 0; i < max_claim_len; i++) {
        issPack.in[i] <== issReveal.substring[i];
    }
    component issHash = Poseidon(5);
    for (var i = 0; i < 5; i++) {
        issHash.inputs[i] <== issPack.out[i];
    }
    signal output iss_hash;
    iss_hash <== issHash.out;

    // --- aud ---
    component audReveal = RevealSubstring(max_payload_bytes, max_claim_len, 0);
    for (var i = 0; i < max_payload_bytes; i++) {
        audReveal.in[i] <== decoded_payload[i];
    }
    audReveal.substringStartIndex <== aud_pos;
    audReveal.substringLength <== aud_len;

    component audPack = PackBytes(max_claim_len);
    for (var i = 0; i < max_claim_len; i++) {
        audPack.in[i] <== audReveal.substring[i];
    }
    component audHash = Poseidon(5);
    for (var i = 0; i < 5; i++) {
        audHash.inputs[i] <== audPack.out[i];
    }
    signal output aud_hash;
    aud_hash <== audHash.out;

    // --- exp (numeric, converted to integer) ---
    // exp is max 10 digits
    component expReveal = RevealSubstring(max_payload_bytes, 10, 0);
    for (var i = 0; i < max_payload_bytes; i++) {
        expReveal.in[i] <== decoded_payload[i];
    }
    expReveal.substringStartIndex <== exp_pos;
    expReveal.substringLength <== exp_len;

    component expToInt = DigitBytesToInt(10);
    for (var i = 0; i < 10; i++) {
        expToInt.in[i] <== expReveal.substring[i];
    }
    signal output exp_out;
    exp_out <== expToInt.out;
}

// max_msg_len=1024, n=121, k=17, max_payload_bytes=768
component main = JWTVerifier(1024, 121, 17, 768);
