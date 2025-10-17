"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const router = useRouter();

  useEffect(() => {
    document.title = "404 | Página não encontrada";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
        padding: "2rem",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Efeitos de fundo suaves */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "10%",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "linear-gradient(45deg, #7B54BE30, #F6C64730)",
          filter: "blur(25px)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "10%",
          width: "180px",
          height: "180px",
          borderRadius: "40%",
          background: "linear-gradient(45deg, #75FABD25, #7B54BE25)",
          filter: "blur(30px)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <div
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          boxShadow:
            "0 16px 40px rgba(0, 0, 0, 0.06), 0 8px 20px rgba(124, 84, 189, 0.08)",
          padding: "3rem 2.5rem",
          maxWidth: "480px",
          textAlign: "center",
          border: "1px solid rgba(124, 84, 189, 0.08)",
          zIndex: 10,
        }}
      >
        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "6rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #7B54BE 0%, #5a3d99 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              lineHeight: 1,
            }}
          >
            404
          </h1>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "6rem",
              fontWeight: 800,
              color: "rgba(124, 84, 189, 0.05)",
              zIndex: -1,
            }}
          >
            404
          </div>
        </div>

        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 600,
            margin: "0 0 1rem",
            color: "#1e293b",
          }}
        >
          Página não encontrada
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "2.5rem",
            fontSize: "1.05rem",
            lineHeight: 1.6,
          }}
        >
          A página que você procura não existe ou foi movida.
          <br />
          <span style={{ color: "#94a3b8" }}>
            Você pode voltar para onde estava.
          </span>
        </p>

        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "linear-gradient(135deg, #7B54BE 0%, #5a3d99 100%)",
            color: "#fff",
            fontWeight: 600,
            padding: "0.9rem 2.2rem",
            borderRadius: "12px",
            fontSize: "1rem",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 14px rgba(124, 84, 189, 0.3)",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.transform =
              "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 6px 20px rgba(124, 84, 189, 0.4)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 14px rgba(124, 84, 189, 0.3)";
          }}
        >
          ← Voltar
        </button>
      </div>

      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          color: "#64748b",
          fontSize: "0.95rem",
          fontWeight: 500,
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "linear-gradient(45deg, #7B54BE, #F6C647)",
          }}
        />
        OnJob Assistência Técnica
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 4rem !important;
          }
          h2 {
            font-size: 1.4rem !important;
          }
          div[style*="padding: 3rem 2.5rem"] {
            padding: 2rem 1.5rem !important;
            margin: 1rem !important;
          }
          button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
