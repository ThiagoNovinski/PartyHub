import { Router } from 'express';
import { cancelarSolicitacao } from '../controllers/solicitacoesController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticacao.js';

const router = Router();

router.patch(
  '/:id/cancelar',
  autenticar,
  exigirPerfil('cliente'),
  cancelarSolicitacao,
);

export default router;
