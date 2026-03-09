# Cerebro

Cerebro is a Zero-Knowledge (ZK) proving service designed to verify JSON Web Tokens (JWT) using Groth16 proofs. It allows clients to generate mathematical proofs that a given JWT is valid according to a specific RSA public key, without revealing sensitive information from the token payload on-chain.

The repository includes:
1. **Node.js Proving Server**: An Express API that uses `snarkjs` and `rapidsnark` to generate Groth16 proofs for JWT verification using circuits from `@zk-email/circuits`.
2. **Cairo Smart Contracts**: Starknet verifier contracts generated via Garaga to verify the ZK proofs on-chain.

## How It Works

1. **Client Request**: A client sends a standard JWT and the corresponding RSA modulus of the issuer to the Cerebro `/prove` API endpoint.
2. **Input Preparation**: The server parses the JWT structure, validates expiration, extracts required claims (sub, iss, aud, nonce, exp), and prepares the inputs for the `jwt_verify.circom` circuit.
3. **Witness Generation**: A witness is calculated using the WebAssembly circuit (`jwt_verify.wasm`) via SnarkJS.
4. **Proof Generation**: A Groth16 proof is quickly generated using the native `rapidsnark` prover (or `snarkjs` as a fallback) against the proving key.
5. **Output**: The API returns the ZK proof and the public signals, which contain the hashes of the JWT claims and the public key hash.
6. **On-Chain Verification**: The client submits the generated proof and public signals to the Cairo Starknet smart contract, which mathematically verifies the proof's validity.

## Use Cases

Cerebro enables various Web3 scenarios where Web2 credentials must interact with smart contracts securely:

* **Account Abstraction**: Creating and controlling Starknet smart accounts using social logins and standard OpenID Connect (OIDC) JWTs.
* **Gasless Login**: Seamlessly onboarding users to Web3 applications using familiar Web2 authentication flows without requiring them to hold crypto initially.
* **Privacy-Preserving Verification**: Verifying the authenticity of off-chain credentials or claims on-chain without explicitly exposing the payload data in the transaction calldata.
* **Session Key Registration**: Authorizing specific session constraints on-chain using a JWT-backed ZK proof.

## How to Run the Proving Server

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn

### Installation
Clone the repository and install the Node.js dependencies:

```bash
npm install
```

### Running the Server

**Development Mode**
Runs the server using `ts-node-dev` with hot-reloading:
```bash
npm run dev
```

**Production Mode**
Runs the server using `ts-node`:
```bash
npm start
```

By default, the Cerebro server actively listens for incoming requests on port `8080`.

### API Usage
Send a POST request to `/prove` with the payload:
```json
{
  "jwt": "eyJhbGciOiJSUzI1NiIs...",
  "modulus": "21387645123490812039...",
}
```

## Smart Contracts

Cerebro utilizes Garaga to generate Cairo 1.0 zero-knowledge verifier contracts located in the `/contracts` directory. Build the contracts using `scarb`:

```bash
cd contracts
scarb build
```

### Contract Addresses
* **Mainnet**: [Pending]
* **Sepolia**: [Pending]

## Roadmap

Upcoming features and security enhancements:

* **Explicit Session Binding**: Implement server-side and circuit-level validation to ensure JWT `nonce` matches the intended `session_key` before generating proofs.
* **Prover Performance**: Integrate `rapidsnark` more deeply for faster proofs and explore JIT-assisted witness generation.
* **JWT Claim Customization**: Allow clients to specify which claims they need hashed or revealed, making the circuit more flexible for non-OIDC use cases.
* **Expanded Provider Support**: Add pre-configured settings for major OIDC providers (Google, Apple, Microsoft) including automatic JWKS management and rotation.
* **Multi-Proof Aggregation**: Support for generating single proofs that verify multiple JWTs or claims simultaneously to save on-chain verification costs.
