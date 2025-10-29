import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // exporta Firestore (firebase-admin)
import admin from "firebase-admin";

export const runtime = "nodejs";

/* ========= Tipos ========= */
type SimNao = "sim" | "nao";
type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";

interface CamisetaItem {
  quantidade: number;
  tamanho?: Tamanho | "" | null;
}

interface PayloadBase {
  nome: string;
  dataNasc: string;
  telefone: string;
  email: string;
  congrega: SimNao;
  igreja?: string | null;
  ehConvidado: SimNao;
  convidadoQuem?: string | null;
  camiseta?: {
    offwhite: CamisetaItem;
    marrom: CamisetaItem;
  } | null;
}

interface Payload extends PayloadBase {
  createdAtISO: string;             // ISO string
  createdAtTS: admin.firestore.FieldValue; // serverTimestamp()
  ip: string | null;
  ua: string | null;
  seq: number;                      // ID sequencial
}

/* ========= CORS ========= */
const ALLOWED_ORIGIN = (process.env.CORS_ORIGIN ?? "*").trim();
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/* ========= Helpers/validators ========= */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isISODateYYYYMMDD(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime());
}
function isSimNao(v: unknown): v is SimNao {
  return v === "sim" || v === "nao";
}
function isTamanho(v: unknown): v is Tamanho {
  return v === "PP" || v === "P" || v === "M" || v === "G" || v === "GG" || v === "XG";
}
function toIntNonNegative(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v) && v >= 0) return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return null;
}

/* ========= Parse + regras ========= */
function parseAndValidateBody(json: unknown): { ok: true; data: PayloadBase } | { ok: false; message: string } {
  if (!isObject(json)) return { ok: false, message: "Formato inválido." };

  const {
    nome, dataNasc, telefone, email,
    congrega, igreja,
    ehConvidado, convidadoQuem,
    camiseta,
  } = json;

  if (!isNonEmptyString(nome)) return { ok: false, message: "Todos os campos são obrigatórios." };
  if (!isISODateYYYYMMDD(dataNasc)) return { ok: false, message: "Todos os campos são obrigatórios." };
  if (!isNonEmptyString(telefone)) return { ok: false, message: "Todos os campos são obrigatórios." };
  if (!isEmail(email)) return { ok: false, message: "Todos os campos são obrigatórios." };
  if (!isSimNao(congrega)) return { ok: false, message: "Todos os campos são obrigatórios." };
  if (!isSimNao(ehConvidado)) return { ok: false, message: "Todos os campos são obrigatórios." };

  let igrejaFinal: string | null = null;
  if (congrega === "sim") {
    if (!isNonEmptyString(igreja)) return { ok: false, message: "Selecione IMUB ou informe o nome da igreja." };
    igrejaFinal = igreja;
  }

  let convidadoQuemFinal: string | null = null;
  if (ehConvidado === "sim") {
    if (!isNonEmptyString(convidadoQuem)) return { ok: false, message: "Informe quem te convidou." };
    convidadoQuemFinal = convidadoQuem;
  }

  let camisetaFinal: PayloadBase["camiseta"] = null;
  if (camiseta !== undefined && camiseta !== null) {
    if (!isObject(camiseta)) return { ok: false, message: "Formato de camiseta inválido." };
    const off = camiseta.offwhite as unknown;
    const mar = camiseta.marrom as unknown;
    if (!isObject(off) || !isObject(mar)) return { ok: false, message: "Formato de camiseta inválido." };

    const offQtd = toIntNonNegative((off as Record<string, unknown>).quantidade);
    const offTamRaw = (off as Record<string, unknown>).tamanho ?? "";
    const offTam = typeof offTamRaw === "string" && offTamRaw !== "" ? offTamRaw : null;
    const offTamValido = offTam === null || isTamanho(offTam);

    const marQtd = toIntNonNegative((mar as Record<string, unknown>).quantidade);
    const marTamRaw = (mar as Record<string, unknown>).tamanho ?? "";
    const marTam = typeof marTamRaw === "string" && marTamRaw !== "" ? marTamRaw : null;
    const marTamValido = marTam === null || isTamanho(marTam);

    if (offQtd === null || !offTamValido) return { ok: false, message: "Dados de camiseta (offwhite) inválidos." };
    if (marQtd === null || !marTamValido) return { ok: false, message: "Dados de camiseta (marrom) inválidos." };

    const okOff = (offQtd ?? 0) > 0 && !!offTam;
    const okMar = (marQtd ?? 0) > 0 && !!marTam;
    if (!okOff && !okMar) {
      return { ok: false, message: "Informe quantidade e tamanho para pelo menos um dos modelos de camiseta." };
    }

    camisetaFinal = {
      offwhite: { quantidade: offQtd ?? 0, tamanho: offTam },
      marrom:   { quantidade: marQtd ?? 0, tamanho: marTam },
    };
  }

  return {
    ok: true,
    data: {
      nome,
      dataNasc,
      telefone,
      email,
      congrega,
      igreja: igrejaFinal,
      ehConvidado,
      convidadoQuem: convidadoQuemFinal,
      camiseta: camisetaFinal,
    },
  };
}

/* ========= POST ========= */
export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as unknown;
    const parsed = parseAndValidateBody(json);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, message: parsed.message }, { status: 400, headers: corsHeaders });
    }

    // enriquecimento
    const createdAtISO = new Date().toISOString();
    const ipHeader = req.headers.get("x-forwarded-for");
    const ip = ipHeader ? ipHeader.split(",")[0]?.trim() || null : null;
    const ua = req.headers.get("user-agent") ?? null;

    // transação: incrementa seq e grava doc com seq
    const colName = (process.env.FIREBASE_COLLECTION ?? "inscricoes_flow").trim();
    const seqDocRef = db.collection("meta").doc("inscricoes_seq"); // doc de sequência
    const colRef = db.collection(colName);

    const result = await db.runTransaction(async (t) => {
      const seqSnap = await t.get(seqDocRef);
      let nextSeq = 1;
      if (!seqSnap.exists) {
        // inicializa
        t.set(seqDocRef, { seq: 1 });
      } else {
        const current = Number(seqSnap.get("seq") ?? 0);
        nextSeq = current + 1;
        t.update(seqDocRef, { seq: nextSeq });
      }

      const payload: Payload = {
        ...parsed.data,
        createdAtISO,
        createdAtTS: admin.firestore.FieldValue.serverTimestamp(),
        ip,
        ua,
        seq: nextSeq,
      };

      const newDocRef = colRef.doc(); // gera id aleatório
      t.set(newDocRef, payload);
      return { docId: newDocRef.id, seq: nextSeq };
    });

    return NextResponse.json(
      { ok: true, id: result.docId, seq: result.seq },
      { status: 201, headers: corsHeaders }
    );
  } catch (e) {
    console.error("[/api/inscricoes] ERRO:", e);
    return NextResponse.json(
      { ok: false, message: "Falha ao processar a inscrição." },
      { status: 500, headers: corsHeaders }
    );
  }
}
