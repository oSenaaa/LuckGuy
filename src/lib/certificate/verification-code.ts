import { customAlphabet } from "nanoid";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generateVerificationCode = customAlphabet(ALPHABET, 10);
