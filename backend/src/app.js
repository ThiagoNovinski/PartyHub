import express from 'express';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratamentoErros.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

export default app;