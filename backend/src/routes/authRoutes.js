import { Router } from 'express';
import { eu, login, registrar } from '../controllers/authController.js';
import { autenticar } from '../middlewares/autenticacao.js';

const router = Router();

router.post('/registrar', registrar);
router.post('/login', login);
router.get('/eu', autenticar, eu);

export default router;
