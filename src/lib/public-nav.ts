/**
 * Rotas públicas destinadas a um visitante externo (participante identificando-se
 * ou assistindo ao treinamento, ou qualquer pessoa conferindo um certificado) —
 * nelas o cabeçalho/rodapé não deve oferecer navegação para a home nem para a
 * área administrativa.
 */
export function isPublicViewerRoute(pathname: string | null) {
  return /^\/(t\/|verificar\/)/.test(pathname ?? "");
}
