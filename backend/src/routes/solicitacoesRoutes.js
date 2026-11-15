import { Router } from 'express';
import {
  cancelarSolicitacao,
  listarSolicitacoesRecebidas,
  responderSolicitacao,
} from '../controllers/solicitacoesController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticacao.js';

const router = Router();

router.get(
  '/recebidas',
  autenticar,
  exigirPerfil('fornecedor'),
  listarSolicitacoesRecebidas,
);

router.patch(
  '/:id/responder',
  autenticar,
  exigirPerfil('fornecedor'),
  responderSolicitacao,
);

router.patch(
  '/:id/cancelar',
  autenticar,
  exigirPerfil('cliente'),
  cancelarSolicitacao,
);

export default router;
