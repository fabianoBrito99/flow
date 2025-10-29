// /app/inscricao/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Input from "../../../componentes/forms/input"; // ajuste o caminho se necessário

type CongregaOpcao = "imub" | "outra" | "";
type SimNao = "sim" | "nao" | "";
type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";

const TAMANHOS: Tamanho[] = ["PP", "P", "M", "G", "GG", "XG"];

/** COTAS DISPONÍVEIS — ajuste conforme seu estoque */
const QUOTAS: {
  offwhite: Record<Tamanho, number>;
  marrom: Record<Tamanho, number>;
} = {
  offwhite: { PP: 8, P: 15, M: 20, G: 18, GG: 12, XG: 6 },
  marrom:   { PP: 5, P: 10, M: 18, G: 20, GG: 10, XG: 4 },
};

const TABELA_MEDIDAS = [
  { tamanho: "PP", largura: 46, altura: 64 },
  { tamanho: "P",  largura: 49, altura: 67 },
  { tamanho: "M",  largura: 52, altura: 70 },
  { tamanho: "G",  largura: 55, altura: 73 },
  { tamanho: "GG", largura: 58, altura: 76 },
  { tamanho: "XG", largura: 61, altura: 79 },
];

export default function InscricaoPage() {
  const router = useRouter();

  // Campos base
  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Congrega?
  const [congrega, setCongrega] = useState<SimNao>("");
  const [opcaoIgreja, setOpcaoIgreja] = useState<CongregaOpcao>("");
  const [igrejaQual, setIgrejaQual] = useState("");

  // Convidado?
  const [ehConvidado, setEhConvidado] = useState<SimNao>("");
  const [convidadoQuem, setConvidadoQuem] = useState("");

  // Camisetas?
  const [querCamiseta, setQuerCamiseta] = useState<SimNao>("");
  const [qtdOffWhite, setQtdOffWhite] = useState(""); // string para manter o Input controlado
  const [tamOffWhite, setTamOffWhite] = useState<Tamanho | "">("");
  const [qtdMarrom, setQtdMarrom] = useState("");
  const [tamMarrom, setTamMarrom] = useState<Tamanho | "">("");

  // feedback
  const [msgObrigatorio, setMsgObrigatorio] = useState("");
  const [msgQuota, setMsgQuota] = useState("");

  const toInt = (v: string) => {
    const n = parseInt((v ?? "").toString().replace(/\D+/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const quotaDe = (modelo: "offwhite" | "marrom", tamanho: Tamanho | ""): number => {
    if (!tamanho) return 0;
    return QUOTAS[modelo][tamanho] ?? 0;
  };

  const validarQuotas = (): boolean => {
    setMsgQuota("");
    if (querCamiseta !== "sim") return true;

    const offQ = toInt(qtdOffWhite);
    const marQ = toInt(qtdMarrom);

    if (offQ > 0) {
      if (!tamOffWhite) {
        setMsgQuota("Selecione o tamanho da camiseta Offwhite.");
        return false;
      }
      const disp = quotaDe("offwhite", tamOffWhite);
      if (offQ > disp) {
        setMsgQuota(`Offwhite ${tamOffWhite}: disponível apenas ${disp} unidade(s).`);
        return false;
      }
    }
    if (marQ > 0) {
      if (!tamMarrom) {
        setMsgQuota("Selecione o tamanho da camiseta Marrom.");
        return false;
      }
      const disp = quotaDe("marrom", tamMarrom);
      if (marQ > disp) {
        setMsgQuota(`Marrom ${tamMarrom}: disponível apenas ${disp} unidade(s).`);
        return false;
      }
    }
    return true;
  };

  // Checagem completa para habilitar o botão
  const isComplete = useMemo(() => {
    const baseOk = nome.trim() && dataNasc && telefone.trim() && email.trim();

    const congregaOk =
      congrega === "nao" ||
      (congrega === "sim" &&
        ((opcaoIgreja === "imub") ||
          (opcaoIgreja === "outra" && igrejaQual.trim())));

    const convidadoOk =
      ehConvidado === "nao" ||
      (ehConvidado === "sim" && convidadoQuem.trim());

    // Camisetas:
    const offQ = toInt(qtdOffWhite);
    const marQ = toInt(qtdMarrom);

    // precisa ao menos 1 modelo com qtd>0 + tamanho
    const camisetaEstrutOk =
      querCamiseta === "nao" ||
      (querCamiseta === "sim" &&
        ((offQ > 0 && !!tamOffWhite) || (marQ > 0 && !!tamMarrom)));

    // quotas
    const quotasOK =
      querCamiseta !== "sim" ||
      (
        (offQ <= 0 || (tamOffWhite && offQ <= quotaDe("offwhite", tamOffWhite))) &&
        (marQ <= 0 || (tamMarrom && marQ <= quotaDe("marrom", tamMarrom)))
      );

    return Boolean(
      baseOk &&
      congrega &&
      congregaOk &&
      ehConvidado &&
      convidadoOk &&
      querCamiseta &&
      camisetaEstrutOk &&
      quotasOK
    );
  }, [
    nome, dataNasc, telefone, email,
    congrega, opcaoIgreja, igrejaQual,
    ehConvidado, convidadoQuem,
    querCamiseta, qtdOffWhite, tamOffWhite, qtdMarrom, tamMarrom
  ]);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!isComplete) {
      setMsgObrigatorio("Todos os campos são obrigatórios.");
      return;
    }
    if (!validarQuotas()) {
      setMsgObrigatorio("");
      return;
    }

    setMsgObrigatorio("");
    setMsgQuota("");

    const payload = {
      nome,
      dataNasc,
      telefone,
      email,
      congrega,
      igreja: congrega === "sim" ? (opcaoIgreja === "imub" ? "IMUB" : igrejaQual) : null,
      ehConvidado,
      convidadoQuem: ehConvidado === "sim" ? convidadoQuem : null,
      camiseta:
        querCamiseta === "sim"
          ? {
              offwhite: { quantidade: toInt(qtdOffWhite) || 0, tamanho: tamOffWhite || null },
              marrom:   { quantidade: toInt(qtdMarrom)   || 0, tamanho: tamMarrom   || null },
            }
          : null,
    };

    try {
      const resp = await fetch("/api/inscricoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: { ok: boolean; id?: string; seq?: number; message?: string } = await resp.json();

      if (resp.ok && data.ok && data.id && typeof data.seq === "number") {
        router.push(`/inscricao/sucesso?id=${encodeURIComponent(data.id)}&seq=${data.seq}`);
        return;
      }
      const msg = data?.message ?? "Não foi possível enviar sua inscrição.";
      router.push(`/inscricao/erro?motivo=${encodeURIComponent(msg)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      router.push(`/inscricao/erro?motivo=${encodeURIComponent(msg)}`);
    }
  };

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px" }}>

      <h1 style={{ marginBottom: 8 }}>Inscrição – Conferência Flow</h1>
      <p style={{ marginTop: 10, opacity: 0.9 }}>
        Preencha seus dados abaixo para garantir sua vaga.
      </p>

      <form onSubmit={onSubmit} noValidate>
        {/* Nome */}
        <Input
          label="Nome completo"
          name="nome"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setMsgObrigatorio(""); }}
          autoComplete="name"
        />

        {/* Data de nascimento */}
        <Input
          label="Data de Nascimento"
          name="data_nascimento"
          type="date"
          value={dataNasc}
          onChange={(e) => { setDataNasc(e.target.value); setMsgObrigatorio(""); }}
        />

        {/* Telefone */}
        <Input
          label="Telefone"
          name="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => { setTelefone(e.target.value); setMsgObrigatorio(""); }}
          autoComplete="tel"
        />

        {/* E-mail */}
        <Input
          label="E-mail"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setMsgObrigatorio(""); }}
          autoComplete="email"
        />

        {/* Congrega? */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Congrega em alguma igreja?
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
            <input
              type="checkbox"
              checked={congrega === "sim"}
              onChange={() => { setCongrega(congrega === "sim" ? "" : "sim"); setMsgObrigatorio(""); }}
            />
            Sim
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={congrega === "nao"}
              onChange={() => { setCongrega(congrega === "nao" ? "" : "nao"); setMsgObrigatorio(""); }}
            />
            Não
          </label>
        </div>

        {/* Se SIM: IMUB/Outra e Qual? */}
        {congrega === "sim" && (
          <div style={{ marginTop: 12, paddingLeft: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Selecione a igreja</div>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
              <input
                type="checkbox"
                checked={opcaoIgreja === "imub"}
                onChange={() => { setOpcaoIgreja(opcaoIgreja === "imub" ? "" : "imub"); setMsgObrigatorio(""); }}
              />
              IMUB
            </label>

            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={opcaoIgreja === "outra"}
                onChange={() => {
                  const novo = opcaoIgreja === "outra" ? "" : "outra";
                  setOpcaoIgreja(novo);
                  if (novo !== "outra") setIgrejaQual("");
                  setMsgObrigatorio("");
                }}
              />
              Outra
            </label>

            {opcaoIgreja === "outra" && (
              <div style={{ marginTop: 8, maxWidth: 520 }}>
                <Input
                  label="Qual?"
                  name="igreja_qual"
                  value={igrejaQual}
                  onChange={(e) => { setIgrejaQual(e.target.value); setMsgObrigatorio(""); }}
                />
              </div>
            )}
          </div>
        )}

        {/* Convidado? */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            É convidado de alguém?
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
            <input
              type="checkbox"
              checked={ehConvidado === "sim"}
              onChange={() => { setEhConvidado(ehConvidado === "sim" ? "" : "sim"); setMsgObrigatorio(""); }}
            />
            Sim
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={ehConvidado === "nao"}
              onChange={() => { setEhConvidado(ehConvidado === "nao" ? "" : "nao"); setMsgObrigatorio(""); }}
            />
            Não
          </label>
        </div>

        {/* Se SIM, quem? */}
        {ehConvidado === "sim" && (
          <div style={{ marginTop: 8, maxWidth: 520 }}>
            <Input
              label="Sim, quem?"
              name="convidado_quem"
              value={convidadoQuem}
              onChange={(e) => { setConvidadoQuem(e.target.value); setMsgObrigatorio(""); }}
            />
          </div>
        )}

        {/* Quer camiseta? */}
        <div style={{ marginTop: 20 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Deseja camiseta?
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 16 }}>
            <input
              type="checkbox"
              checked={querCamiseta === "sim"}
              onChange={() => { setQuerCamiseta(querCamiseta === "sim" ? "" : "sim"); setMsgObrigatorio(""); }}
            />
            Sim
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={querCamiseta === "nao"}
              onChange={() => { setQuerCamiseta(querCamiseta === "nao" ? "" : "nao"); setMsgObrigatorio(""); }}
            />
            Não
          </label>
        </div>
         {/* Tabela de Medidas */}
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                Clique aqui para ver: Tabela de Medidas (cm)
              </summary>
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 420,
                    borderCollapse: "collapse",
                    border: "1px solid #e0e0e0",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <thead style={{ background: "#ffffffff" }}>
                    <tr>
                      <th style={thCell}>Tamanho</th>
                      <th style={thCell}>Largura (cm)</th>
                      <th style={thCell}>Altura (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABELA_MEDIDAS.map((m) => (
                      <tr key={m.tamanho}>
                        <td style={tdCell}>{m.tamanho}</td>
                        <td style={tdCell}>{m.largura}</td>
                        <td style={tdCell}>{m.altura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <small style={{ display: "block", marginTop: 6, opacity: 0.8 }}>
                  * Medidas aproximadas. Podem variar ±2cm.
                </small>
              </div>
            </details>

        {/* Se SIM, fotos + escolher modelo/tamanho/quantidade com cotas */}
        {querCamiseta === "sim" && (
          <div style={{ marginTop: 12, paddingLeft: 12, display: "grid", gap: 16 }}>
            {/* OFFWHITE */}
            <fieldset style={{ border: "1px solid #ccc", borderRadius: 10, padding: 12 }}>
              <legend style={{ padding: "0 6px", fontWeight: 700 }}>Modelo 1 – Offwhite</legend>
              

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", marginBottom: 8 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
                  <Image
                    src="/camiseta1.jpeg"
                    alt="Camiseta Offwhite"
                    width={900}
                    height={900}
                    style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #e8e8e8" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Tamanho</label>
                  <select
                    value={tamOffWhite}
                    onChange={(e) => {
                      setTamOffWhite(e.target.value as Tamanho | "");
                      // ajusta quantidade se exceder a cota
                      const disp = quotaDe("offwhite", e.target.value as Tamanho | "");
                      const atual = toInt(qtdOffWhite);
                      if (atual > disp) setQtdOffWhite(String(disp || ""));
                      setMsgObrigatorio("");
                      setMsgQuota("");
                    }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cfcfcf" }}
                  >
                    <option value="">Selecione…</option>
                    {TAMANHOS.map((t) => (
                      <option key={`off-${t}`} value={t} disabled={quotaDe("offwhite", t) <= 0}>
                        {t} {quotaDe("offwhite", t) <= 0 ? "— Esgotado" : ""}
                      </option>
                    ))}
                  </select>
                  {!!tamOffWhite && (
                    <small style={{ opacity: 0.85, display: "block", marginTop: 6 }}>
                      Disponível: {quotaDe("offwhite", tamOffWhite)} unidade(s)
                    </small>
                  )}
                </div>

                <Input
                  label="Quantidade"
                  name="qtd_offwhite"
                  type="number"
                  value={qtdOffWhite}
                  onChange={(e) => {
                    const disp = quotaDe("offwhite", tamOffWhite);
                    let v = toInt(e.target.value);
                    if (v < 0) v = 0;
                    if (tamOffWhite && v > disp) v = disp; // trava na cota
                    setQtdOffWhite(v ? String(v) : "");
                    setMsgObrigatorio("");
                    setMsgQuota("");
                  }}
                  min={0}
                  max={tamOffWhite ? quotaDe("offwhite", tamOffWhite) : 0}
                />
              </div>
            </fieldset>

            {/* MARROM */}
            <fieldset style={{ border: "1px solid #ccc", borderRadius: 10, padding: 12 }}>
              <legend style={{ padding: "0 6px", fontWeight: 700 }}>Modelo 2 – Marrom</legend>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr", marginBottom: 8 }}>
                <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
                  <Image
                    src="/camiseta2.jpg"
                    alt="Camiseta Marrom"
                    width={900}
                    height={900}
                    style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #e8e8e8" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Tamanho</label>
                  <select
                    value={tamMarrom}
                    onChange={(e) => {
                      setTamMarrom(e.target.value as Tamanho | "");
                      const disp = quotaDe("marrom", e.target.value as Tamanho | "");
                      const atual = toInt(qtdMarrom);
                      if (atual > disp) setQtdMarrom(String(disp || ""));
                      setMsgObrigatorio("");
                      setMsgQuota("");
                    }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cfcfcf" }}
                  >
                    <option value="">Selecione…</option>
                    {TAMANHOS.map((t) => (
                      <option key={`marrom-${t}`} value={t} disabled={quotaDe("marrom", t) <= 0}>
                        {t} {quotaDe("marrom", t) <= 0 ? "— Esgotado" : ""}
                      </option>
                    ))}
                  </select>
                  {!!tamMarrom && (
                    <small style={{ opacity: 0.85, display: "block", marginTop: 6 }}>
                      Disponível: {quotaDe("marrom", tamMarrom)} unidade(s)
                    </small>
                  )}
                </div>

                <Input
                  label="Quantidade"
                  name="qtd_marrom"
                  type="number"
                  value={qtdMarrom}
                  onChange={(e) => {
                    const disp = quotaDe("marrom", tamMarrom);
                    let v = toInt(e.target.value);
                    if (v < 0) v = 0;
                    if (tamMarrom && v > disp) v = disp;
                    setQtdMarrom(v ? String(v) : "");
                    setMsgObrigatorio("");
                    setMsgQuota("");
                  }}
                  min={0}
                  max={tamMarrom ? quotaDe("marrom", tamMarrom) : 0}
                />
              </div>
            </fieldset>

           

            <small style={{ opacity: 0.8 }}>
              * Informe quantidade e tamanho para pelo menos um dos modelos.
            </small>
          </div>
        )}

        {/* Mensagens */}
        {msgQuota && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              background: "#402216",
              color: "#F8EACD",
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 600,
            }}
          >
            {msgQuota}
          </div>
        )}

        {msgObrigatorio && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              background: "#3b1d13",
              color: "#F8EACD",
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 10,
              padding: "10px 12px",
              fontWeight: 600,
            }}
          >
            {msgObrigatorio}
          </div>
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap", marginBottom: 150}}>
          <button
            type="submit"
            disabled={!isComplete}
            style={{
              background: !isComplete
                ? "linear-gradient(180deg,#b5b0ac,#9e978f)"
                : "linear-gradient(180deg,#FF7A1A,#E96E16)",
              color: "#1F130D",
              fontWeight: 800,
              padding: "12px 18px",
              borderRadius: 999,
              border: 0,
              cursor: isComplete ? "pointer" : "not-allowed",
              opacity: isComplete ? 1 : 0.7,
              transition: "filter .15s ease, transform .15s ease",
            }}
          >
            Enviar inscrição
          </button>

          <button
            type="reset"
            onClick={() => {
              setNome("");
              setDataNasc("");
              setTelefone("");
              setEmail("");
              setCongrega("");
              setOpcaoIgreja("");
              setIgrejaQual("");
              setEhConvidado("");
              setConvidadoQuem("");
              setQuerCamiseta("");
              setQtdOffWhite("");
              setTamOffWhite("");
              setQtdMarrom("");
              setTamMarrom("");
              setMsgObrigatorio("");
              setMsgQuota("");
            }}
            style={{
              background: "transparent",
              color: "#2d2d2d",
              border: "1px solid #ccc",
              padding: "12px 18px",
              borderRadius: 999,
              cursor: "pointer",
            }}
          >
            Limpar
          </button>
        </div>
      </form>
    </main>
  );
}

const thCell: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #e0e0e0",
  fontWeight: 700,
  fontSize: 14,
};
const tdCell: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f0f0f0",
  fontSize: 14,
};
