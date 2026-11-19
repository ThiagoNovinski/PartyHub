FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN if [ -f package.json ]; then npm ci; fi

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "if [ -f package.json ]; then [ -x node_modules/.bin/vite ] || npm ci; npm run dev -- --host 0.0.0.0 --port 5173; else echo 'Nenhum package.json encontrado em ./frontend. Crie o projeto React + Vite para iniciar o servidor.' && tail -f /dev/null; fi"]

FROM dev AS builder

RUN npm run build

FROM nginx:1.27-alpine AS prod

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
