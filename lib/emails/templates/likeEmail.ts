import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function likeEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, quelqu'un a like ton profil !`,
    html: emailLayout(`
      ${heading('Nouveau like !')}
      ${paragraph("Quelqu'un a aime ton profil sur PAKT. Connecte-toi pour decouvrir qui et voir si c'est un match.")}
      ${ctaButton('Voir qui me like')}
    `),
  }
}
