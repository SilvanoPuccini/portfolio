export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-sm text-slate-400 md:flex-row">
        <p>© {new Date().getFullYear()} Silvano Puccini.</p>
        <p>Full Stack Developer · Tech Premium Minimal</p>
      </div>
    </footer>
  );
}
