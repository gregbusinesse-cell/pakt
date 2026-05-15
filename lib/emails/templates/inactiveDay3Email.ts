import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function inactiveDay3Email(firstName: string): { subject: string; html: string } {
  return {
    subject: `${firstName}, dernier rappel PAKT`,
    html: emailLayout(`
      ${heading('On ne te derange plus apres ca')}
      ${paragraph("Ca fait 3 jours qu'on ne t'a pas vu. C'est notre dernier rappel — on respecte ta boite mail.")}
      ${paragraph("Si tu veux continuer a recevoir les opportunites PAKT, passe nous voir.")}
      ${ctaButton('Revenir sur PAKT')}
    `),
  }
}
