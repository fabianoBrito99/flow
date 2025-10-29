import { Suspense } from "react";
import ErroClient from "@/app/erro/ErroClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
          <p>Carregando…</p>
        </main>
      }
    >
      <ErroClient />
    </Suspense>
  );
}
