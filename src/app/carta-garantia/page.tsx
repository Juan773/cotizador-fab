import FormularioCarta from "@/components/FormularioCarta";

export const metadata = { title: "Carta de garantía · Spacio Home" };

export default function CartaGarantiaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Carta de garantía</h1>
        <p className="text-sm text-stone-500">Genera la carta garantía de servicio en PDF.</p>
      </div>
      <FormularioCarta />
    </div>
  );
}
