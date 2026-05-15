import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function inactiveDay1Email(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, de nouveaux profils t'attendent`,
    html: emailLayout(`
      ${heading('Tu nous manques !')}
      ${paragraph("De nouveaux profils sont arrives sur PAKT depuis ta derniere visite. Ne rate pas l'opportunite de decouvrir des personnes qui partagent tes ambitions.")}
      ${ctaButton('Voir les nouveaux profils')}
    `),
  }
}
