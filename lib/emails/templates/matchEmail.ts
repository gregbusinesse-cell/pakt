import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function matchEmail(firstName: string, unsubscribeUrl?: string): { subject: string; html: string } {
  const name = firstName?.trim() || ''

  return {
    subject: name ? `${name}, tu as un nouveau match !` : 'Tu as un nouveau match sur PAKT !',
    html: emailLayout(`
      ${heading('Nouveau match !')}
      ${paragraph("C'est un match ! Vous avez tous les deux like vos profils. Commence la conversation maintenant.")}
      ${ctaButton('Voir mon match', `${APP_URL}/matches`)}
    `, unsubscribeUrl),
  }
}
