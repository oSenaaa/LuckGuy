export {};

declare global {
  interface UserPublicMetadata {
    role?: "admin" | "editor" | "viewer";
    name?: string;
  }
}
