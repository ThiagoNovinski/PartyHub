import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'segredo-apenas-para-testes-com-mais-de-32-caracteres',
      BCRYPT_ROUNDS: '4',
    },
  },
});