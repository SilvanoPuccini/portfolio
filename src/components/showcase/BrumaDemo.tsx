import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/content/servicios';
import styles from './BrumaDemo.module.css';

const copy = {
  es: { notice: 'Ejemplo ilustrativo · negocio ficticio · sin compras ni reservas reales', back: 'Volver a Web y Landing', eyebrow: 'Café de estación · concepto de diseño', title: 'Una pausa. Un café. Tu momento.', intro: 'Un espacio imaginario para encontrar sabores simples, una mesa tranquila y una conversación sin apuro.', menu: 'La carta', visit: 'El espacio', action: 'Explorar la carta', menuTitle: 'Poco, bien hecho.', menuIntro: 'Una selección de ejemplo para mostrar cómo un negocio puede presentar su propuesta con claridad.', items: [['Café de especialidad', 'Espresso, filtrado y opciones con leche.'], ['Panadería de estación', 'Hogazas, croissants y tostadas.'], ['Mesa compartida', 'Platos sencillos para una pausa más larga.']], contactTitle: 'Imaginá tu próxima pausa.', contactText: 'Esta página muestra diseño adaptable, navegación y contenido. No representa un local real ni un proyecto entregado a un cliente.', question: '¿Puedo reservar o hacer un pedido?', answer: 'No. Es una demostración sin envío de formularios, teléfono, dirección, correo ni cobros. En un proyecto real, el canal de contacto se define en el alcance contratado.', return: 'Ver paquetes de Web', preview: 'Vista previa de Bruma' },
  en: { notice: 'Illustrative example · fictional business · no real purchases or bookings', back: 'Back to Web and Landing', eyebrow: 'Seasonal café · design concept', title: 'A pause. A coffee. Your moment.', intro: 'An imaginary space for simple flavors, a quiet table and a conversation with no rush.', menu: 'The menu', visit: 'The space', action: 'Explore the menu', menuTitle: 'Less, done well.', menuIntro: 'A sample selection showing how a business can explain its offer clearly.', items: [['Specialty coffee', 'Espresso, filter coffee and milk options.'], ['Seasonal bakery', 'Loaves, croissants and toast.'], ['Shared table', 'Simple dishes for a longer pause.']], contactTitle: 'Imagine your next pause.', contactText: 'This page demonstrates responsive design, navigation and content. It is not a real café or a delivered customer project.', question: 'Can I book or place an order?', answer: 'No. This demonstration has no form submissions, phone, address, email or payments. A real project defines the contact channel in its agreed scope.', return: 'See Web packages', preview: 'Bruma preview' },
} as const;

/** Editorial split hero/menu adapted from LANIN; provenance in public/showcase/bruma/README.md. */
export default function BrumaDemo({ locale, preview = false }: { locale: Locale; preview?: boolean }) {
  const t = copy[locale];
  const Title = preview ? 'h3' : 'h1';
  return <div className={`${styles.demo} ${preview ? styles.preview : ''}`} lang={locale} aria-label={preview ? t.preview : undefined}>
    {!preview && <div className={styles.notice}><span>{t.notice}</span><Link href={`/${locale}/services/web`}>{t.back}</Link></div>}
    <div className={styles.nav}><span className={styles.brand}>BRUMA</span>{!preview && <nav aria-label={locale === 'es' ? 'Navegación del ejemplo' : 'Example navigation'}><a href="#bruma-menu">{t.menu}</a><a href="#bruma-space">{t.visit}</a></nav>}</div>
    <div className={styles.hero}>
      <div><div className={styles.eyebrow}>{t.eyebrow}</div><Title>{t.title}</Title><p>{t.intro}</p>{!preview && <a className={styles.action} href="#bruma-menu">{t.action}</a>}</div>
      <Image src="/showcase/bruma/cafe.svg" width={800} height={680} alt={locale === 'es' ? 'Ilustración conceptual de una taza junto a una ventana, no una fotografía de un local real' : 'Concept illustration of a cup by a window, not a photograph of a real café'} sizes="(max-width: 680px) 100vw, 50vw" />
    </div>
    {!preview && <><section id="bruma-menu" className={`${styles.menu} scroll-mt-40`}><div><h2>{t.menuTitle}</h2><p>{t.menuIntro}</p></div><ul>{t.items.map(([name, detail]) => <li key={name}><strong>{name}</strong><span>{detail}</span></li>)}</ul></section>
      <section id="bruma-space" className={`${styles.contact} scroll-mt-40`}><div><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div><div><details><summary>{t.question}</summary><p>{t.answer}</p></details><Link className={styles.action} href={`/${locale}/services/web#packages`}>{t.return}</Link></div></section></>}
  </div>;
}
