"use client";
import Link from "next/link";
import { useEffect } from "react";

const NotFound = () => {
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
      }}
    >
      {/* Floating shapes for visual interest */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: "linear-gradient(45deg, #7B54BE20, #F6C64720)",
          filter: "blur(20px)",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "60%",
          right: "15%",
          width: "150px",
          height: "150px",
          borderRadius: "30%",
          background: "linear-gradient(45deg, #75FABD20, #7B54BE20)",
          filter: "blur(25px)",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(124, 84, 189, 0.1)",
          padding: "4rem 3rem",
          maxWidth: "500px",
          textAlign: "center",
          border: "1px solid rgba(124, 84, 189, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #7B54BE, #F6C647, #75FABD)",
          }}
        />

        {/* 404 with modern styling */}
        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "6rem",
              fontWeight: 800,
              margin: 0,
              background: "linear-gradient(135deg, #7B54BE 0%, #5a3d99 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
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
              letterSpacing: "-0.02em",
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
            letterSpacing: "-0.01em",
          }}
        >
          Página não encontrada
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "2.5rem",
            fontSize: "1.1rem",
            lineHeight: 1.6,
          }}
        >
          A página que você está procurando não existe ou foi movida.
          <br />
          <span style={{ color: "#94a3b8" }}>
            Vamos te ajudar a encontrar o caminho de volta.
          </span>
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #7B54BE 0%, #5a3d99 100%)",
              color: "#fff",
              fontWeight: 600,
              padding: "0.875rem 2rem",
              borderRadius: "12px",
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(124, 84, 189, 0.3)",
              transition: "all 0.3s ease",
              border: "none",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 24px rgba(124, 84, 189, 0.4)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 4px 16px rgba(124, 84, 189, 0.3)";
            }}
          >
            <span>←</span>
            Voltar ao início
          </Link>

          <button
            onClick={() => window.history.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "transparent",
              color: "#7B54BE",
              fontWeight: 600,
              padding: "0.875rem 2rem",
              borderRadius: "12px",
              fontSize: "1rem",
              border: "2px solid #7B54BE",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#7B54BE";
              (e.currentTarget as HTMLElement).style.color = "#fff";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#7B54BE";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            Página anterior
          </button>
        </div>
      </div>

      {/* Brand footer with modern styling */}
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
            font-size: 1.5rem !important;
          }
          div[style*="padding: 4rem 3rem"] {
            padding: 2.5rem 2rem !important;
            margin: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
