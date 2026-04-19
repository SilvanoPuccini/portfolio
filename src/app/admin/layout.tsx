export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0a0a14', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
