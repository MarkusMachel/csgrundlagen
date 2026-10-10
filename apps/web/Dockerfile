# Build context is the repo root (npm workspaces share the root lockfile):
#   docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @csgrundlagen/web --include-workspace-root=false
COPY apps/web apps/web
# Talk to the real Go API instead of the MSW mocks.
ENV VITE_USE_MOCKS=false
# Who runs this instance, named in the privacy policy (e.g. "Jane Doe, privacy@example.com").
ARG VITE_PRIVACY_CONTACT=""
ENV VITE_PRIVACY_CONTACT=$VITE_PRIVACY_CONTACT
RUN npm run build --workspace @csgrundlagen/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
