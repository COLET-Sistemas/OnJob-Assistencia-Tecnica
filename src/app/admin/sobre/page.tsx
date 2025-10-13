"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import packageInfo from "../../../../package.json";

export default function SobrePage() {
  const [apiVersion, setApiVersion] = useState<string>("não definido");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const version = localStorage.getItem("versao_api") || "não definido";
      setApiVersion(version);
    }
  }, []);
  return (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="p-6 md:p-8 flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logoEscrito.png"
            alt="Colet Sistemas Logo"
            width={220}
            height={66}
            className="mb-4"
          />
          <h1 className="text-3xl font-semibold text-gray-800 mb-1">
            Sobre o OnJob
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            OnJob é propriedade da Colet Sistemas de Gestão.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <div className="space-y-4">
            <div className="border border-gray-100 rounded-lg p-5 shadow-sm">
              <h2 className="text-xl font-medium text-gray-800 mb-3">
                Informações de Contato
              </h2>

              <div className="space-y-3">
                <div>
                  <p className="text-base text-gray-600">
                    Conheça nossas soluções:
                  </p>
                  <Link
                    href="https://www.coletsistemas.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium"
                  >
                    https://www.coletsistemas.com.br
                  </Link>
                </div>

                <div>
                  <p className="text-base text-gray-600">Suporte técnico:</p>
                  <Link
                    href="mailto:suporte.onjob@coletsistemas.com.br"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium"
                  >
                    suporte.onjob@coletsistemas.com.br
                  </Link>
                </div>

                <div>
                  <p className="text-base text-gray-600">
                    Sugestões e melhorias:
                  </p>
                  <Link
                    href="mailto:onjob@coletsistemas.com.br"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium"
                  >
                    onjob@coletsistemas.com.br
                  </Link>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Suas sugestões serão avaliadas e, se aprovadas, poderão ser
                incluídas em versões futuras.
              </p>
            </div>

            <div className="border border-gray-100 rounded-lg p-5 shadow-sm">
              <h2 className="text-xl font-medium text-gray-800 mb-3">
                Informações do Sistema
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-base text-gray-600">
                    Versão da Aplicação:
                  </span>
                  <span className="text-base font-medium text-[#7B54BE]">
                    {packageInfo.version}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-base text-gray-600">
                    Versão da API:
                  </span>
                  <span className="text-base font-medium text-[#7B54BE]">
                    {isMounted ? apiVersion : "..."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2000–2025 Colet Sistemas de Gestão. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
