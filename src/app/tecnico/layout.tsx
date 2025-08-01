import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Técnico | Colet Assistência Técnica",
    description: "Área técnica do sistema Colet Assistência Técnica.",
};

interface TecnicoLayoutProps {
    children: React.ReactNode;
}

export default function TecnicoLayout({ children }: TecnicoLayoutProps) {
    return (
        <html lang="pt-BR">
            <body className="antialiased bg-gray-50 min-h-screen">
                {/* Aqui você pode adicionar um header, sidebar, etc. */}
                {children}
            </body>
        </html>
    );
}