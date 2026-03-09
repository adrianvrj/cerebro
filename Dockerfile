# ============================================================
# Stage 1: Build rapidsnark (native C++ prover)
# ============================================================
FROM node:20-bookworm AS builder-rapidsnark

RUN apt-get update && apt-get install -y \
    build-essential cmake nasm libgmp-dev libsodium-dev git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/iden3/rapidsnark.git /rapidsnark
WORKDIR /rapidsnark
RUN mkdir build_dir && cd build_dir && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DUSE_ASM=ON && \
    make -j$(nproc)

# ============================================================
# Stage 2: Production runtime
# ============================================================
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y libgmp10 libsodium23 curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ src/

# Copy build artifacts (only what's needed at runtime)
COPY build/jwt_verify_js/jwt_verify.wasm build/jwt_verify_js/jwt_verify.wasm
COPY build/jwt_verify_js/witness_calculator.js build/jwt_verify_js/witness_calculator.js
COPY build/jwt_verify_js/generate_witness.js build/jwt_verify_js/generate_witness.js

# Copy rapidsnark binary from builder
COPY --from=builder-rapidsnark /rapidsnark/build_dir/src/prover build/rapidsnark
RUN chmod +x build/rapidsnark

# The .zkey is too large for git. Download from external storage at build time.
# Set ZKEY_URL as a build arg (e.g. S3/R2/GCS presigned URL)
RUN curl -L -o build/jwt_verify_final.zkey \
    "https://cerebro-objects.s3.us-east-1.amazonaws.com/jwt_verify_final.zkey"

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npx", "ts-node", "src/server.ts"]
