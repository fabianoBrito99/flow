"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./relatorio.module.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";
type SimNao = "sim" | "nao";

interface CamisetaItem {
  quantidade: number;
  tamanho: Tamanho | null;
}
interface Camiseta {
  offwhite: CamisetaItem | null | undefined;
  marrom: CamisetaItem | null | undefined;
}

interface InscricaoDTO {
  id: string;
  seq: number;
  nome: string;
  email: string;
  telefone: string;
  dataNasc: string;
  congrega: SimNao;
  igreja: string | null;
  ehConvidado: SimNao;
  convidadoQuem: string | null;
  camiseta: Camiseta | null;
  createdAtISO: string;
}

function formatDMY(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function formatOnlyDate(d: string): string {
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

export default function RelatorioPage() {
  const [itens, setItens] = useState<InscricaoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [somenteComCamiseta, setSomenteComCamiseta] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/inscricoes/listar?limit=2000");
        const j = (await r.json()) as { ok: boolean; items: InscricaoDTO[] };
        setItens(j.ok ? j.items : []);
      } catch {
        setItens([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    const txt = filtroTexto.trim().toLowerCase();
    const base = itens.filter((i) => {
      if (somenteComCamiseta) {
        const tem =
          (i.camiseta?.offwhite?.quantidade ?? 0) > 0 ||
          (i.camiseta?.marrom?.quantidade ?? 0) > 0;
        if (!tem) return false;
      }
      if (!txt) return true;
      const alvo = `${i.seq} ${i.nome} ${i.email} ${i.telefone} ${i.igreja ?? ""}`.toLowerCase();
      return alvo.includes(txt);
    });
    return base.sort((a, b) => a.seq - b.seq);
  }, [itens, filtroTexto, somenteComCamiseta]);

  const total = filtrados.length;

  const baixarCSV = () => {
    const header = [
      "seq","id","nome","email","telefone","dataNasc",
      "congrega","igreja","ehConvidado","convidadoQuem",
      "camiseta","createdAt",
    ];
    const rows = filtrados.map((i) => [
      i.seq,
      i.id,
      i.nome,
      i.email,
      i.telefone,
      formatOnlyDate(i.dataNasc),
      i.congrega,
      i.igreja ?? "",
      i.ehConvidado,
      i.convidadoQuem ?? "",
      camisetaStr(i.camiseta),
      formatDMY(i.createdAtISO),
    ]);
    const csv = [header.join(";"), ...rows.map((r) => r.map((v) => String(v).replaceAll(";", ",")).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inscricoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const baixarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    autoTable(doc, {
      head: [[
        "Seq","Nome","Email","Telefone","Congrega","Igreja",
        "Convidado?","Quem?","Camiseta","Nasc.","Criado em"
      ]],
      body: filtrados.map((i) => [
        String(i.seq),
        i.nome,
        i.email,
        i.telefone,
        i.congrega === "sim" ? "Sim" : "Não",
        i.igreja ?? "-",
        i.ehConvidado === "sim" ? "Sim" : "Não",
        i.convidadoQuem ?? "-",
        camisetaStr(i.camiseta),
        formatOnlyDate(i.dataNasc),
        formatDMY(i.createdAtISO),
      ]),
      margin: { top: 56, left: 24, right: 24, bottom: 24 },
      theme: "grid",
      headStyles: { fillColor: [100, 55, 30], textColor: [255, 193, 149] },
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 34, halign: "right" },
        1: { cellWidth: 140 },
        2: { cellWidth: 160 },
        3: { cellWidth: 90 },
        4: { cellWidth: 64, halign: "center" },
        5: { cellWidth: 110 },
        6: { cellWidth: 76, halign: "center" },
        7: { cellWidth: 120 },
        8: { cellWidth: 160 },
        9: { cellWidth: 70, halign: "center" },
        10:{ cellWidth: 110 },
      },
      didDrawPage: () => {
        doc.setFontSize(14);
        doc.text(`Relatório de Inscrições (Total: ${total})`, 24, 28);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${formatDMY(new Date().toISOString())}`, 24, 44);
      },
    });

    doc.save("inscricoes.pdf");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Relatório de Inscrições</h1>

      <div className={styles.controls}>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={somenteComCamiseta}
              onChange={(e) => setSomenteComCamiseta(e.target.checked)}
            />
            <span>Apenas quem pediu camiseta</span>
          </label>

          <span className={styles.counter}>
            Total: <b>{total}</b>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <input
            placeholder="Filtrar por nome, e-mail, telefone, igreja…"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            style={{
              padding: "0.5rem 0.6rem",
              borderRadius: 8,
              border: "1px solid #ddd",
              minWidth: 260,
            }}
          />
          <button onClick={baixarCSV} className="btn">CSV</button>
          <button onClick={baixarPDF} className="btn">PDF</button>
        </div>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Seq</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Congrega</th>
                <th>Igreja</th>
                <th>Convidado?</th>
                <th>Quem?</th>
                <th>Camiseta</th>
                <th>Nasc.</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((i) => (
                <tr key={i.id}>
                  <td className={styles.tdRight}>{i.seq}</td>
                  <td>{i.nome}</td>
                  <td>{i.email}</td>
                  <td>{i.telefone}</td>
                  <td className={styles.tdCenter}>{i.congrega === "sim" ? "Sim" : "Não"}</td>
                  <td>{i.igreja ?? "-"}</td>
                  <td className={styles.tdCenter}>{i.ehConvidado === "sim" ? "Sim" : "Não"}</td>
                  <td>{i.convidadoQuem ?? "-"}</td>
                  <td>{camisetaStr(i.camiseta)}</td>
                  <td>{formatOnlyDate(i.dataNasc)}</td>
                  <td>{formatDMY(i.createdAtISO)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
