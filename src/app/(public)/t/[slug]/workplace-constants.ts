/**
 * Valor sentinela enviado pelo formulário público quando o participante
 * seleciona "Matriz / Nenhum posto específico" em vez de um posto de
 * trabalho real. Não corresponde a nenhuma linha em `company_workplaces` —
 * a Server Action trata esse valor como "sem posto" e grava `workplaceId`
 * como `null` (coluna já é nullable, sem necessidade de migração).
 */
export const MATRIZ_WORKPLACE_VALUE = "__matriz__";
