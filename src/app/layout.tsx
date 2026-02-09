import "@/styles/globals.css";

export const metadata = {
  title: "Lista aplikacji",
  description: "Strona internetowa z łączami do predefiniowanych stron",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900 font-sans">
        <main className="max-w-8xl mx-auto py-10 px-4 min-h-screen flex flex-col">
          <header className="mb-6">
            <h1 className="text-4xl font-bold text-center">Lista aplikacji</h1>
          </header>
          {children}
          <footer className="mt-auto text-center text-sm text-gray-400 pt-10">
            &copy; {new Date().getFullYear()} Company Sp. z o.o.
          </footer>
        </main>
      </body>
    </html>
  );
}