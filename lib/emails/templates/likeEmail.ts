import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function likeEmail(firstName: string): { subject: string; html: string } {
  const name = firstName?.trim() || ''

  return {
    subject: name ? `${name}, quelqu'un a like ton profil !` : "Quelqu'un a like ton profil sur PAKT !",
    html: emailLayout(`
      ${heading('Nouveau like !')}
      ${paragraph("Quelqu'un a aime ton profil sur PAKT. Connecte-toi pour decouvrir qui et voir si c'est un match.")}
      ${ctaButton('Voir qui me like', `${APP_URL}/matches`)}
    `),
  }
}
