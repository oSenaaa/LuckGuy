import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/sessions(.*)",
  "/api/blob(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) return;

  const { orgId } = await auth();

  // Autenticado + org == ADMIN_ORG_ID + papel org:admin. Caso contrário:
  // páginas -> redirect para /sem-acesso; requisições de API -> 404.
  await auth.protect(
    (has) => Boolean(process.env.ADMIN_ORG_ID) &&
      orgId === process.env.ADMIN_ORG_ID &&
      has({ role: "org:admin" }),
    { unauthorizedUrl: new URL("/sem-acesso", req.url).toString() },
  );
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
