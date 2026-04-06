import Link from "next/link";

export default function CTA() {
  return (
    <section className="px-6 py-20 text-center">
      <h2 className="mb-6 text-4xl font-bold">¿Trabajamos juntos?</h2>
      <p className="mb-8 text-slate-400">
        Convirtamos tu idea en un producto digital sólido y escalable.
      </p>
      <Link
        href="/contacto"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-black"
      >
        Contactar
      </Link>
    </section>
  );
}
