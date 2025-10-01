import Image from "next/image";

export default function RevisaoPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <Image
        src="/images/logoEscrito.png"
        alt="Logo Colet"
        width={260}
        height={80}
        style={{ marginBottom: "2rem", height: "auto" }}
        priority
      />
      <h1 style={{ fontSize: "2rem", color: "#333", marginBottom: "1rem" }}>
        Funcionalidade será liberada em breve.
      </h1>
      <p style={{ color: "#666" }}>
        Estamos trabalhando para trazer essa funcionalidade o quanto antes!
      </p>
    </div>
  );
}
