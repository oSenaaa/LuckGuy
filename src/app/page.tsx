export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-semibold">Plataforma de Treinamentos NR</h1>
      <p className="mt-2 text-sm text-gray-600">
        Acesse o treinamento pelo link enviado pela sua empresa, ou entre no{" "}
        <a href="/admin" className="underline">
          painel administrativo
        </a>
        .
      </p>
    </main>
  );
}
