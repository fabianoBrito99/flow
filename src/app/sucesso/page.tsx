import styles from "./sucesso.module.css";
import { CheckCircle } from "lucide-react"; // ou use um emoji se preferir

export default function Page() {
  return (
    <div className={styles.container}>
      <CheckCircle className={styles.icone} />
      <h1 className={styles.titulo}>Inscrição feita com sucesso! Te esperamos na Conferencia</h1>
    </div>
  );
}
