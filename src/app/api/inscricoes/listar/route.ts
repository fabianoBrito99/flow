import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";
type SimNao = "sim" | "nao";

export interface InscricaoDTO {
  id: string;
  seq: number;
  nome: string;
  email: string;
  telefone: string;
  dataNasc: string;                 // YYYY-MM-DD
  congrega: SimNao;
  igreja: string | null;
  ehConvidado: SimNao;
  convidadoQuem: string | null;
  camiseta: {
    offwhite?: { quantidade: number; tamanho: Tamanho | null } | null;
    marrom?: { quantidade: number; tamanho: Tamanho | null } | null;
  } | null;
  createdAtISO: string;
}

function isNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
function isString(s: unknown): s is string {
  return typeof s === "string";
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const limitParam = search.get("limit");
    const limit = limitParam ? Math.min(2000, Math.max(1, parseInt(limitParam, 10))) : 1000;

    const collection = (process.env.FIREBASE_COLLECTION ?? "inscricoes_flow").trim();

    const snap = await db
      .collection(collection)
      .orderBy("seq", "asc")
      .limit(limit)
      .get();

    const lista: InscricaoDTO[] = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        seq: isNumber(v.seq) ? v.seq : 0,
        nome: isString(v.nome) ? v.nome : "",
        email: isString(v.email) ? v.email : "",
        telefone: isString(v.telefone) ? v.telefone : "",
        dataNasc: isString(v.dataNasc) ? v.dataNasc : "",
        congrega: (v.congrega === "sim" ? "sim" : "nao") as SimNao,
        igreja: (v.igreja ?? null) as string | null,
        ehConvidado: (v.ehConvidado === "sim" ? "sim" : "nao") as SimNao,
        convidadoQuem: (v.convidadoQuem ?? null) as string | null,
        camiseta: v.camiseta
          ? {
              offwhite: v.camiseta.offwhite
                ? {
                    quantidade: Number(v.camiseta.offwhite.quantidade ?? 0),
                    tamanho: (v.camiseta.offwhite.tamanho ?? null) as Tamanho | null,
                  }
                : null,
              marrom: v.camiseta.marrom
                ? {
                    quantidade: Number(v.camiseta.marrom.quantidade ?? 0),
                    tamanho: (v.camiseta.marrom.tamanho ?? null) as Tamanho | null,
                  }
                : null,
            }
          : null,
        createdAtISO: isString(v.createdAtISO) ? v.createdAtISO : "",
      };
    });

    return NextResponse.json({ ok: true, items: lista });
  } catch (e) {
    console.error("[/api/inscricoes/listar] ERRO:", e);
    return NextResponse.json({ ok: false, message: "Falha ao listar." }, { status: 500 });
  }
}
