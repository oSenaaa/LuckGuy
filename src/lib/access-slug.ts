import { customAlphabet } from "nanoid";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export const generateAccessSlug = customAlphabet(ALPHABET, 8);
