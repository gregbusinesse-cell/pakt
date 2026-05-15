import { emailLayout, ctaButton, heading, paragraph } from './layout'

export function welcomeEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: `Bienvenue sur PAKT, ${firstName} !`,
    html: emailLayout(`
      ${heading(`Bienvenue ${firstName} !`)}
      ${paragraph("Ton compte PAKT est pret. Tu fais maintenant partie d'une communaute de professionnels ambitieux.")}
      ${paragraph("Complete ton profil, ajoute tes competences et commence a decouvrir des profils qui matchent avec tes ambitions.")}
      ${ctaButton('Decouvrir des profils')}
    `),
  }
}
