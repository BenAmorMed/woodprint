import nodemailer from 'nodemailer';

// Configuration factice d'un SMTP de base (à changer en production via variables .env)
const transporteur = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || 'utilisateur',
    pass: process.env.SMTP_PASS || 'motdepasse',
  },
});

export const envoyerEmail = async (destinataire: string, sujet: string, html: string) => {
  try {
    const info = await transporteur.sendMail({
      from: '"Léquipe WoodPrint" <noreply@woodprint.com>',
      to: destinataire,
      subject: sujet,
      html: html,
    });
    console.log('Message envoyé: %s', info.messageId);
    return true;
  } catch (erreur) {
    console.error('Erreur lors de lenvoi de lemail:', erreur);
    return false;
  }
};

export const emailReinitialisationPwd = async (email: string, jeton: string) => {
  const lien = `http://frontend-url.com/reinitialisation-mot-de-passe?jeton=${jeton}`;
  const html = `<h3>WoodPrint - Réinitialisation</h3><p>Cliquez sur ce lien pour réinitialiser: <a href="${lien}">${lien}</a></p>`;
  await envoyerEmail(email, 'Réinitialisation de votre mot de passe WoodPrint', html);
};
