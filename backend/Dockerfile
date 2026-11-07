# Image de base : Node.js 22 en version allégée (Debian slim).
# J'utilise slim plutôt qu'alpine parce que bcrypt a besoin de binaires
# précompilés pour glibc (alpine utilise musl et forcerait une compilation).
FROM node:22-slim

WORKDIR /app

# OpenSSL est nécessaire au moteur Prisma, il n'est pas inclus dans slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Couche des dépendances : copier d'abord package*.json et installer.
# Comme ces fichiers changent rarement, Docker met cette couche en cache
# et ne réinstalle pas les dépendances à chaque modification du code.
COPY package*.json ./
RUN npm ci

# Puis le reste du code (schéma Prisma, migrations, sources)
COPY . .

# Génère le client Prisma à partir du schéma : obligatoire ici, car `npm ci`
# s'est exécuté AVANT que le schéma ne soit copié, donc le client n'existe pas
RUN npx prisma generate

# Port sur lequel l'API écoute (documentaire : c'est le compose qui publie le port)
EXPOSE 4000

# Démarrage simple : les migrations et le seed sont lancés par le compose
# juste avant (voir la clé command de docker-compose.yml)
CMD ["npm", "start"]
