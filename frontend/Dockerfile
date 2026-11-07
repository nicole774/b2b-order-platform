# Build en 2 étapes (multi-stage) :
# étape 1 — construire le site avec Node et Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# étape 2 — servir le résultat avec nginx, une image très légère.
# Node et toutes les dépendances de build ne sont PAS embarqués :
# l'image finale ne contient que le dossier dist/.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
