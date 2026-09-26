import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/sessions(.*)",
  "/api/blob(.*)",
  "/api/companies(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return;

  // Exige apenas sessão Clerk válida — a checagem de papel (admin/editor/
  // visualizador) fica em src/app/admin/layout.tsx e nas Server Actions/Route
  // Handlers via src/lib/permissions.ts (defesa em profundidade).
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
