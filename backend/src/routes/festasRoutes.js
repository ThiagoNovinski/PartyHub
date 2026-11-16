import { Router } from 'express';
import {
  cancelarFesta,
  criarFesta,
  editarFesta,
  listarMinhasFestas,
  obterFesta,
} from '../controllers/festasController.js';
import { criarSolicitacao } from '../controllers/solicitacoesController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticacao.js';

const router = Router();

router.use(autenticar, exigirPerfil('cliente'));

router.get('/', listarMinhasFestas);
router.post('/', criarFesta);
router.get('/:id', obterFesta);
router.put('/:id', editarFesta);
router.patch('/:id/cancelar', cancelarFesta);
router.post('/:id/solicitacoes', criarSolicitacao);

export default router;
