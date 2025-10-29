"use client";

import { useEffect } from "react";
import "./globals.css";
import Script from "next/script";
import { NavMenu } from "../../componentes/navMenu/navemenu";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => {
        console.log("Service Worker registrado!");
      });
    }
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#2d8f00ff" />
        <link rel="manifest" href="/manifest.json" />
        <title>Nigth Run Rockets</title>
      </head>
      <body>
        {children}
        <NavMenu />
      </body>
    </html>
  );
}
