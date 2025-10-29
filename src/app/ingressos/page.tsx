// src/app/ingressos/page.tsx
"use client";

import { useState } from "react";
import styles from "./ingressos.module.css";

type SimNao = "sim" | "nao";
type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";

interface CamisetaItem {
  quantidade: number;
  tamanho: Tamanho | null;
}
interface Camiseta {
  offwhite: CamisetaItem | null | undefined;
  marrom: CamisetaItem | null | undefined;
}

interface IngressoDTO {
  id: string;
  seq: number;
  nome: string;
  email: string;
  telefone: string;
  dataNasc: string;              // YYYY-MM-DD
  congrega: SimNao;
  igreja: string | null;
  ehConvidado: SimNao;
  convidadoQuem: string | null;
  camiseta: Camiseta | null;
  createdAtISO: string;
}

function brDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function onlyDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function camisetaStr(c: Camiseta | null): string {
  const parts: string[] = [];
  if (c?.offwhite && c.offwhite.quantidade > 0) {
    parts.push(`Offwhite ${c.offwhite.tamanho ?? "-"} x${c.offwhite.quantidade}`);
  }
  if (c?.marrom && c.marrom.quantidade > 0) {
    parts.push(`Marrom ${c.marrom.tamanho ?? "-"} x${c.marrom.quantidade}`);
  }
  return parts.join(" | ") || "-";
}

export default function IngressosPorNomePage() {
  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState(""); // opcional
  const [itens, setItens] = useState<IngressoDTO[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setErro("");
    setItens([]);
    if (nome.trim().length < 3) {
      setErro("Digite pelo menos 3 letras do nome.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("nome", nome.trim());
      if (dataNasc) params.set("dataNasc", dataNasc);
      params.set("limit", "25");
      const r = await fetch(`/api/meusingressos?${params.toString()}`);
      const j = (await r.json()) as { ok: boolean; items?: IngressoDTO[]; message?: string };
      if (!r.ok || !j.ok || !j.items) {
        throw new Error(j.message ?? "Não foi possível localizar seu ingresso.");
      }
      setItens(j.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Meus Ingressos</h1>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <div className={styles.dobBox}>
          <label className={styles.label}>Data de nascimento (opcional)</label>
          <input
            type="date"
            value={dataNasc}
            onChange={(e) => setDataNasc(e.target.value)}
          />
        </div>
        <button onClick={buscar} disabled={nome.trim().length < 3}>
          Buscar
        </button>
      </div>

      {loading && <p>Carregando…</p>}
      {!!erro && <p className={styles.error}>{erro}</p>}

      <ul className={styles.list}>
        {itens.map((i) => (
          <li key={i.id} className={styles.ticket}>
            <div className={styles.ticketHeader}>
              <span className={styles.ticketType}>Ingresso</span>
              <span className={styles.ticketPrice}># {i.seq}</span>
            </div>

            <div className={styles.ticketBody}>
              <p><strong>Nome:</strong> {i.nome}</p>
              <p><strong>E-mail:</strong> {i.email}</p>
              <p><strong>Telefone:</strong> {i.telefone}</p>
              <p><strong>Nascimento:</strong> {onlyDate(i.dataNasc)}</p>
              <p><strong>Congrega:</strong> {i.congrega === "sim" ? "Sim" : "Não"}</p>
              <p><strong>Igreja:</strong> {i.igreja ?? "-"}</p>
              <p><strong>Camiseta:</strong> {camisetaStr(i.camiseta)}</p>
              <p><strong>Convidado?</strong> {i.ehConvidado === "sim" ? "Sim" : "Não"}</p>
            </div>

            <div className={styles.ticketFooter}>
              <small>Inscrito em {brDateTime(i.createdAtISO)}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
