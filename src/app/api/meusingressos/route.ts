// src/app/api/meusingressos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

type SimNao = "sim" | "nao";
type Tamanho = "PP" | "P" | "M" | "G" | "GG" | "XG";

interface CamisetaItem {
  quantidade: number;
  tamanho: Tamanho | null;
}
interface Camiseta {
  offwhite?: CamisetaItem | null;
  marrom?: CamisetaItem | null;
}
interface IngressoDTO {
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

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;

    const nome = (search.get("nome") ?? "").trim();
    const dataNasc = (search.get("dataNasc") ?? "").trim(); // opcional YYYY-MM-DD
    const limitParam = search.get("limit");
    const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : 25;

    if (nome.length < 3) {
      return NextResponse.json(
        { ok: false, message: "Informe pelo menos 3 letras do nome." },
        { status: 400 }
      );
    }

    const collection = (process.env.FIREBASE_COLLECTION ?? "inscricoes_flow").trim();

    // Busca por prefixo do nome (sensível a maiúsculas/minúsculas no Firestore)
    const end = nome + "\uf8ff";
    const snap = await db
      .collection(collection)
      .orderBy("nome")
      .startAt(nome)
      .endAt(end)
      .limit(limit)
      .get();

    let itens: IngressoDTO[] = snap.docs.map((d) => {
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

    if (dataNasc) {
      itens = itens.filter((i) => i.dataNasc === dataNasc);
    }

    itens.sort((a, b) => a.seq - b.seq);

    return NextResponse.json({ ok: true, items: itens });
  } catch (e) {
    console.error("[/api/meusingressos] ERRO:", e);
    return NextResponse.json(
      { ok: false, message: "Falha ao buscar ingressos." },
      { status: 500 }
    );
  }
}
