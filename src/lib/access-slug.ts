import { customAlphabet } from "nanoid";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export const generateAccessSlug = customAlphabet(ALPHABET, 8);

// PIN numérico de 6 dígitos, segredo compartilhado exibido ao admin junto do
// link e exigido no formulário de identificação do participante.
export const generateAccessPin = customAlphabet("0123456789", 6);
