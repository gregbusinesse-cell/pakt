// lib/emails/index.ts
// Barrel export for email system

export { sendEmail, getUnsubscribeUrl, type EmailType } from './sendEmail'
export { shouldSendEmail, isProfileIncomplete } from './shouldSendEmail'

export { welcomeEmail } from './templates/welcomeEmail'
export { likeEmail } from './templates/likeEmail'
export { matchEmail } from './templates/matchEmail'
export { inactiveDay1Email } from './templates/inactiveDay1Email'
export { inactiveDay2Email } from './templates/inactiveDay2Email'
export { inactiveDay3Email } from './templates/inactiveDay3Email'
export { incompleteProfileEmail } from './templates/incompleteProfileEmail'
