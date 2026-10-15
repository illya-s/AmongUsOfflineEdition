FROM ghcr.io/voidzero-dev/vite-plus:1.2.0

WORKDIR /app

COPY --chown=vp:vp package.json bun.lock ./
RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

CMD ["vp", "build"]
