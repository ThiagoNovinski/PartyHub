import { Router } from 'express';
import {
  adicionarServico,
  alterarAtivo,
  editarServico,
  listarFornecedores,
  obterFornecedor,
  removerServico,
  salvarMeuPerfil,
} from '../controllers/fornecedoresController.js';
import { autenticar, exigirPerfil } from '../middlewares/autenticacao.js';

const router = Router();

router.get('/', listarFornecedores);

router.put('/meu', autenticar, exigirPerfil('fornecedor'), salvarMeuPerfil);
router.post(
  '/meu/servicos',
  autenticar,
  exigirPerfil('fornecedor'),
  adicionarServico,
);
router.put(
  '/meu/servicos/:id',
  autenticar,
  exigirPerfil('fornecedor'),
  editarServico,
);
router.delete(
  '/meu/servicos/:id',
  autenticar,
  exigirPerfil('fornecedor'),
  removerServico,
);
router.patch('/meu/ativo', autenticar, exigirPerfil('fornecedor'), alterarAtivo);

router.get('/:id', obterFornecedor);

export default router;
