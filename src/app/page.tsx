"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "../../styles/Home.module.css";
import { Carousel } from "../../componentes/Carousel";

const GALLERY = ["/i1.jpeg", "/i2.jpeg", "/i3.jpeg", "/i4.jpeg", "/i5.jpeg"];

export default function Home() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Image
          src="/logo.png"
          alt="Logo Conferência Flow"
          width={480}
          height={450}
          quality={100}
          className={styles.logo}
          priority
        />
      </header>

      <section className={styles.hero}>
        <h1 className={styles.title}>
          Conferência Flow – <br />
          Movidos pelo Espírito
        </h1>
        <p className={styles.dateLocal}>
          <strong>22 e 23 de Novembro de 2025.</strong>
        </p>

        <p className={styles.lead}>
          Você está pronto para ser despertado, renovado e conduzido pelo
          Espírito de Deus?
        </p>
        <p className={styles.paragraph}>
          Na Conferência Flow, vamos juntos experimentar momentos de louvor,
          adoração e ministração que vão acender a chama que Deus colocou em
          nós, liberando dons e propósito.
        </p>

        <div className={styles.block}>
          <div className={styles.blockCent}>
            <h2 className={styles.blockTitle}>Por que participar?</h2>
          </div>

          <ul className={styles.benefitsList}>
            <li>
              Reavivar o dom que Deus já colocou em você{" "}
              <span className={styles.ref}>(2Tm 1:6)</span>
            </li>
            <li>Ser movido pelo Espírito, sem medo, com liberdade e paixão</li>
            <li>
              Experimentar um culto e momentos de adoração que transformam vidas
            </li>
            <li>
              Conectar-se com uma geração que deseja viver fluindo no Espírito
            </li>
          </ul>
        </div>

        <p className={styles.notice}>
          Vagas limitadas — garanta já o seu lugar e venha ser movido, aceso e
          transformado pelo Espírito de Deus.
        </p>
        <p className={styles.notice}>
          Inscreva-se agora e prepare-se para viver no Flow do Espírito!
        </p>

        <div className={styles.ctaArea}>
          <Link href="/inscricao" className={styles.cta}>
            Inscreva-se agora
          </Link>
        </div>
      </section>

      <br />
      <div>
        Ainda tá em dúvida de fazer sua inscrição?
        <br /> <br /> Veja um pouquinho como foi ano passado...
      </div>

      {/* VÍDEO */}
      <section className={styles.mediaSection} aria-label="Vídeo teaser">
        <div className={styles.mediaCard}>
          <div className={styles.mediaHead}>
            <h2 className={styles.mediaTitle}>Conferência Inabaláveis 2024</h2>
          </div>

          <video
            autoPlay
            loop
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            controls
            className={styles.video}
          >
            <source src="/RocketsVideo.mp4" type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
        </div>
      </section>

      {/* CARROSSEL */}
      <section className={styles.gallerySection} aria-label="Galeria de fotos">
        <div className={styles.mediaHead}></div>
        <div className={styles.carouselWrap}>
          <Carousel photos={GALLERY} interval={5000} />
        </div>

        {/* --- SURPRESA + CTA --- */}
        <div className={styles.surpriseStrip}>
          <div className={styles.surpriseText}>
            <h3 className={styles.surpriseTitle}>Surpresa especial 🎁</h3>
            <p className={styles.surpriseP}>
              Teremos uma surpresa para as{" "}
              <strong>100 primeiras pessoas</strong> que fizerem a inscrição
              <strong> com camiseta</strong>: uma{" "}
              <strong>bela pulseira de brinde!</strong>
            </p>
            <div className={styles.surpriseImageWrap}>
              <Image
                src="/pulseira.png"
                alt="Pulseira brinde para as 100 primeiras inscrições com camiseta"
                width={380}
                height={50}
                quality={100}
                className={styles.surpriseImage}
              />
            </div>
          </div>
        </div>
        {/* --- FIM --- */}
        <div className={styles.ctaArea}>
          <Link href="/inscricao" className={styles.cta}>
            Inscreva-se agora
          </Link>
        </div>

        <p className={styles.instagramCta}>
          Conheça nossas Redes Sociais <br />
          <br />
          <div>
            <a
              href="https://www.instagram.com/rederockets/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.igLink}
            >
              Rede Rockets
            </a>
          </div>
        </p>
      </section>
    </main>
  );
}
