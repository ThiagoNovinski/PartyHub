FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN if [ -f package.json ]; then npm install; fi

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "if [ -f package.json ]; then [ -d node_modules ] || npm install; npm run dev -- --host 0.0.0.0 --port 5173; else echo 'Nenhum package.json encontrado em ./frontend. Crie o projeto React + Vite para iniciar o servidor.' && tail -f /dev/null; fi"]
