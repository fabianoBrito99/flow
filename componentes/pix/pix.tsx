"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

import styles from "../../src/app/inscricao/page.module.css";
import Input from "../forms/input";
import Button from "../forms/button";

export type PixFormProps = {
  tipo: "adulto" | "crianca";
  valor: number;
  participaEquipe: boolean;
  nomeEquipe: string;
  dataNascimento: string;
  shirtSize: "PP" | "P" | "M" | "G" | "GG" | "4" | "6" | "8" | "10" | "12" | "14" | "16";
  onSuccess: () => void;
};

export function PixForm({
  tipo,
  valor,
  participaEquipe,
  nomeEquipe,
  shirtSize,
  onSuccess,
  dataNascimento,
}: PixFormProps) {
  const [form, setForm] = useState({
    email: "",
    nome: "",
    cpf: "",
    telefone: "",
    igreja: "",
    dataNascimento: "",
  });
  const [otherIgreja, setOtherIgreja] = useState("");
  const { email, nome, cpf, telefone, igreja } = form;

  const [qrCode, setQrCode] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [status, setStatus] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // valida campos obrigatórios
  useEffect(() => {
    const ok =
      Boolean(email) &&
      nome.trim().length >= 6 &&
      /^[0-9]{11}$/.test(cpf) &&
      Boolean(telefone) &&
      Boolean(igreja) &&
      (igreja !== "outra" || Boolean(otherIgreja));
    setIsReady(ok);
  }, [email, nome, cpf, telefone, igreja, otherIgreja]);

  // atualiza form e limpa otherIgreja se trocar de opção
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      setForm((p) => ({ ...p, cpf: value.replace(/\D/g, "").slice(0, 11) }));
    } else if (name === "igreja") {
      setForm((p) => ({ ...p, igreja: value }));
      if (value !== "outra") setOtherIgreja("");
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  // grava no Firestore APENAS após aprovação
  const salvarDados = useCallback(
    async (pid: string) => {
      const finalIgreja = igreja === "outra" ? otherIgreja : igreja;
      const payload = {
        email,
        nome,
        cpf,
        telefone,
        igreja: finalIgreja,
        tipo,
        transaction_amount: valor,
        metodo: "pix",
        status: "approved",
        paymentId: pid,
        participaEquipe,
        dataNascimento,
        nomeEquipe: participaEquipe ? nomeEquipe : null,
        shirtSize, // 👕 garante que o aprovado também mantém o tamanho
        timestamp: new Date().toISOString(),
      };
      console.log("[DEBUG /api/salvar_dados] payload:", payload);
      await fetch("/api/salvar_dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    [email, nome, cpf, telefone, igreja, otherIgreja, tipo, valor, participaEquipe, nomeEquipe, shirtSize, dataNascimento]
  );

  // gera o QR code Pix (AGORA ENVIANDO shirtSize no body!)
  const pagarPix = async () => {
    try {
      setStatus("Gerando QR Code...");
      const finalIgreja = igreja === "outra" ? otherIgreja : igreja;

      const payload = {
        email,
        nome,
        cpf,
        telefone,
        igreja: finalIgreja,
        tipo,
        transaction_amount: valor,
        participaEquipe,
        nomeEquipe: participaEquipe ? nomeEquipe : null,
        shirtSize,
        dataNascimento, 
      };

      console.log("[DEBUG /api/pagar_pix] payload:", payload);

      const res = await fetch("/api/pagar_pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("[DEBUG /api/pagar_pix] response:", res.status, data);

      if (!res.ok) {
        setStatus(`Erro: ${data?.message || res.statusText}`);
        return;
      }

      setQrCode(data.qr_code_base64);
      setPixKey(data.qr_code);
      setPaymentId(data.payment_id);
      setStatus("QR Code gerado");
    } catch (err) {
      setStatus("Erro ao gerar QR Code");
      console.error(err);
    }
  };

  // polling para verificar aprovação (usa sua rota /api/verifica_pagamento)
  useEffect(() => {
    if (!paymentId) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/verificar_pagamento?id=${paymentId}`);
        const d: { status?: string; error?: string } = await r.json();

        if (d.status === "approved") {
          clearInterval(iv);
          setStatus("Pagamento aprovado!");
          await salvarDados(paymentId);
          onSuccess(); // decrementa estoque
          window.location.href = "/sucesso";
        }
      } catch (e) {
        console.error("[poll] erro verificar pagamento:", e);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [paymentId, salvarDados, onSuccess]);

  return (
    <div className={styles.paymentContainer}>
      <h2>Pix (R$ {valor.toFixed(2).replace(".", ",")})</h2>

      <Input label="E-mail" name="email" value={email} onChange={handleChange} />
      <Input label="Nome Completo" name="nome" value={nome} onChange={handleChange} />
      <Input
        label="CPF (11 dígitos)"
        name="cpf"
        value={cpf}
        onChange={handleChange}
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <Input label="Telefone" name="telefone" value={telefone} onChange={handleChange} />

      <div className={styles.option}>
        <label>Igreja</label>
        <select name="igreja" value={igreja} onChange={handleChange}>
          <option value="">Selecione a igreja</option>
          <option value="IMUB">IMUB presidencial</option>
          <option value="outra">Outra</option>
          <option value="nenhuma">Nenhuma</option>
        </select>
      </div>

      {igreja === "outra" && (
        <Input
          label="Qual é sua igreja?"
          name="outraIgreja"
          value={otherIgreja}
          onChange={(e) => setOtherIgreja(e.target.value)}
        />
      )}

      <Button onClick={pagarPix} disabled={!isReady}>
        Gerar QR Code
      </Button>

      {qrCode && (
        <div className={styles.qrBox}>
          <Image src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" width={200} height={200} />
          <button
            className={styles.copyBtn}
            onClick={() => {
              navigator.clipboard.writeText(pixKey);
              setStatus("Código Pix copiado!");
            }}
          >
            📋 Copiar
          </button>
          <pre className={styles.pixKey}>{pixKey}</pre>
        </div>
      )}

      <p className={styles.status}>{status}</p>
    </div>
  );
}
