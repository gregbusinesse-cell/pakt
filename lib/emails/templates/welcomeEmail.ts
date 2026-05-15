import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function welcomeEmail(firstName: string): { subject: string; html: string } {
  const name = firstName?.trim() || ''
  const greeting = name ? `Bienvenue ${name} !` : 'Bienvenue !'

  return {
    subject: name ? `Bienvenue sur PAKT, ${name} !` : 'Bienvenue sur PAKT !',
    html: emailLayout(`
      ${heading(greeting)}
      ${paragraph("Ton compte PAKT est pret. Tu fais maintenant partie d'une communaute de professionnels ambitieux.")}
      ${paragraph("Complete ton profil, ajoute tes competences et commence a decouvrir des profils qui matchent avec tes ambitions.")}
      ${ctaButton('Decouvrir des profils', `${APP_URL}/swipe`)}
    `),
  }
}
