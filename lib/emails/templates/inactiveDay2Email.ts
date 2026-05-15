import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function inactiveDay2Email(firstName: string): { subject: string; html: string } {
  const name = firstName?.trim() || ''

  return {
    subject: name ? `${name}, tes connexions attendent` : 'Tes connexions attendent sur PAKT',
    html: emailLayout(`
      ${heading("L'ambition n'attend pas")}
      ${paragraph("Ca fait 2 jours que tu n'es pas passe sur PAKT. Pendant ce temps, d'autres professionnels cherchent des profils comme le tien.")}
      ${paragraph("Un seul swipe peut changer la donne.")}
      ${ctaButton('Revenir sur PAKT', `${APP_URL}/swipe`)}
    `),
  }
}
