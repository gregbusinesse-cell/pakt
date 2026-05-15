import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function matchEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, tu as un nouveau match !`,
    html: emailLayout(`
      ${heading('Nouveau match !')}
      ${paragraph("C'est un match ! Vous avez tous les deux like vos profils. Commence la conversation maintenant.")}
      ${ctaButton('Envoyer un message')}
    `),
  }
}
