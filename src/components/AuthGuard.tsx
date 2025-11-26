"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
};

const AuthGuardInner: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { showError } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get("authError");
    const permissionDenied = searchParams.get("permissionDenied");

    if (authError) {
      showError("Autenticacao", authError);
    }

    if (permissionDenied) {
      showError("Acesso negado", permissionDenied);
    }

    if (authError || permissionDenied) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, showError]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          router.push(
            "/?authError=Sua sessão expirou, faça login novamente."
          );
          return;
        }

        const data = await response.json();
        if (!data?.authenticated) {
          router.push(
            "/?authError=Sua sessão expirou, faça login novamente."
          );
        }
      } catch (error) {
        console.error("Erro ao validar sessão:", error);
        router.push("/?authError=Sua sessão expirou, faça login novamente.");
      }
    };

    checkAuth();

    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [router]);

  return children;
};

export default AuthGuard;
