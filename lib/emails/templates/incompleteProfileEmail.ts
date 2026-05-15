import { emailLayout, ctaButton, heading, paragraph, APP_URL } from './layout'

export function incompleteProfileEmail(
  firstName: string,
  reasons: string[]
): { subject: string; html: string } {
  const name = firstName?.trim() || ''

  const tips: string[] = []
  if (reasons.includes('photos')) tips.push('Ajoute au moins 4 photos pour un profil attractif')
  if (reasons.includes('bio')) tips.push('Ecris une bio de plus de 30 caracteres')
  if (reasons.includes('skills')) tips.push('Ajoute tes competences cles')

  const tipsList = tips.map((t) => `<li style="margin-bottom:8px;color:rgba(255,255,255,0.6);font-size:14px;">${t}</li>`).join('')

  return {
    subject: name ? `${name}, ton profil peut attirer beaucoup plus de monde` : 'Ton profil PAKT peut attirer plus de monde',
    html: emailLayout(`
      ${heading('Optimise ton profil')}
      ${paragraph("Les profils complets recoivent jusqu'a 3x plus de likes. Voici ce qui manque au tien :")}
      <ul style="margin:0 0 16px;padding-left:20px;">${tipsList}</ul>
      ${paragraph("Quelques minutes suffisent pour faire la difference.")}
      ${ctaButton('Completer mon profil', `${APP_URL}/profile?tab=edit`)}
    `),
  }
}
