"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ErroClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const motivo = sp.get("motivo") ?? "Falha ao enviar sua inscrição.";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1rem",
        background: "linear-gradient(135deg,#ffecec,#ffd6d6)",
        color: "#5a1212",
      }}
    >
      <div
        style={{
          background: "white",
          border: "1px solid #f2c1c1",
          borderRadius: 12,
          padding: "24px 20px",
          maxWidth: 680,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8 }}>Não foi possível concluir 😕</h1>
        <p style={{ marginTop: 0 }}>{motivo}</p>

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "#fff",
              color: "#333",
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            Voltar
          </button>
          <button
            onClick={() => router.push("/inscricao")}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "linear-gradient(180deg,#FF7A1A,#E96E16)",
              color: "#1F130D",
              fontWeight: 800,
              border: 0,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </main>
  );
}
