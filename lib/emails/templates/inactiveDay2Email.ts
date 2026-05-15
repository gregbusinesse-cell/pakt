import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function inactiveDay2Email(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, tes connexions attendent`,
    html: emailLayout(`
      ${heading("L'ambition n'attend pas")}
      ${paragraph("Ca fait 2 jours que tu n'es pas passe sur PAKT. Pendant ce temps, d'autres professionnels cherchent des profils comme le tien.")}
      ${paragraph("Un seul swipe peut changer la donne.")}
      ${ctaButton('Reprendre le swipe')}
    `),
  }
}
