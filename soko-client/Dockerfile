FROM node:26-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# nur der Mapbox-Token als Build-Arg. VITE_API_URL bleibt ungesetzt,
# damit api.ts den relativen Pfad /api/v1 baut und nginx proxied.
ARG VITE_PUBLIC_MAPBOX_TOKEN
# Umami: beide leer lassen, und der Tracker wird gar nicht erst eingehaengt.
ARG VITE_UMAMI_SRC
ARG VITE_UMAMI_ID
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
