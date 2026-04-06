export default function ContactoPage() {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="mb-6 text-4xl font-bold">Contacto</h1>
      <form className="flex flex-col gap-4">
        <input
          placeholder="Nombre"
          className="rounded-lg border border-white/10 bg-surface p-3"
        />
        <input
          placeholder="Email"
          className="rounded-lg border border-white/10 bg-surface p-3"
        />
        <textarea
          rows={5}
          placeholder="Mensaje"
          className="rounded-lg border border-white/10 bg-surface p-3"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-3 font-semibold text-black"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
