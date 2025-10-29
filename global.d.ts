// global.d.ts (na raiz do projeto)

export {};

interface MercadoPagoInstance {
  bricks(): {
    create(
      type: "payment" | "cardPayment",
      containerId: string,
      config: {
        initialization: {
          amount: number;
          entityType: "individual" | "association";
          payer: {
            email: string;
            firstName: string;
            lastName: string;
            identification: { type: "CPF"; number: string };
          };
        };
        customization: {
          /** Para Payment Brick */
          paymentMethods?: {
            creditCard: {
              minInstallments: number;
              maxInstallments: number;
              defaultInstallments: number;
            };
          };
          /** Para Card Payment Brick */
          installments?: {
            minInstallments: number;
            maxInstallments: number;
            defaultInstallments: number;
          };
          visual?: { style: { theme: string } };
        };
        callbacks: {
          onReady: () => void;
          onSubmit: (data: {
            paymentMethod: { id: string };
            token: string;
            issuer: { id: string | number };
            installments?: number;
          }) => void;
          onError: (err: unknown) => void;
        };
      }
    ): Promise<void>;
  };
}

declare global {
  interface Window {
    MercadoPago: {
      new (publicKey: string, opts: { locale: string }): MercadoPagoInstance;
    };
  }
}
