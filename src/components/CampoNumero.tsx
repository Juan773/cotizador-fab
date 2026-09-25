"use client";

import { useEffect, useState } from "react";

interface Props {
  valor: number;
  onCambio: (n: number) => void;
  className?: string;
  /** Se muestra y edita multiplicado por este factor (100 para porcentajes). */
  factor?: number;
  "aria-label"?: string;
  id?: string;
}

/** Input numérico que permite escribir libremente ("", "12.", "0,5") y reporta números. */
export default function CampoNumero({ valor, onCambio, className = "campo", factor = 1, ...resto }: Props) {
  const aTexto = (n: number) => (n === 0 ? "" : String(Math.round(n * factor * 1e6) / 1e6));
  const [texto, setTexto] = useState(aTexto(valor));

  // Sincroniza si el valor cambia desde fuera (p. ej. al duplicar una fila).
  useEffect(() => {
    const actual = Number(texto.replace(",", ".")) / factor || 0;
    if (Math.abs(actual - valor) > 1e-9) setTexto(aTexto(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <input
      {...resto}
      type="text"
      inputMode="decimal"
      placeholder="0"
      className={`${className} text-right tabular-nums`}
      value={texto}
      onChange={(e) => {
        const limpio = e.target.value.replace(/[^\d.,]/g, "");
        setTexto(limpio);
        const n = Number(limpio.replace(",", "."));
        onCambio(Number.isFinite(n) ? n / factor : 0);
      }}
    />
  );
}
