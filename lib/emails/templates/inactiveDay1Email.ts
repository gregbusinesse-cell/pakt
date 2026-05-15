import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function inactiveDay1Email(firstName: string, unsubscribeUrl?: string): { subject: string; html: string } {
  const name = firstName?.trim() || ''

  return {
    subject: name ? `${name}, de nouveaux profils t'attendent` : "De nouveaux profils t'attendent sur PAKT",
    html: emailLayout(`
      ${heading('Tu nous manques !')}
      ${paragraph("De nouveaux profils sont arrives sur PAKT depuis ta derniere visite. Ne rate pas l'opportunite de decouvrir des personnes qui partagent tes ambitions.")}
      ${ctaButton('Revenir sur PAKT', `${APP_URL}/swipe`)}
    `, unsubscribeUrl),
  }
}
