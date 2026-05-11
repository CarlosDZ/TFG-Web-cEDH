const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

let transporterInstance = null;

function getTransporter() {
  if (transporterInstance) return transporterInstance;
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporterInstance;
}

function buildVerificationToken(userId) {
  return jwt.sign(
    { id: userId.toString(), purpose: "email_verify" },
    process.env.JWT_SECRET_KEY_MIDDLEWARE,
    { expiresIn: "1d" },
  );
}

function verifyVerificationToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET_KEY_MIDDLEWARE);
  if (payload.purpose !== "email_verify")
    throw new Error("Token de propósito incorrecto");
  return payload;
}

function buildVerificationUrl(token) {
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${base}/verificar-correo?token=${encodeURIComponent(token)}`;
}

async function sendVerificationEmail(user) {
  const token = buildVerificationToken(user._id);
  const url = buildVerificationUrl(token);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1c2f4a;">
      <h2 style="color: #3c3489;">Bienvenido a Legends cEDH, ${escapeHtml(user.username)}</h2>
      <p>Gracias por crear tu cuenta. Para empezar a usar la plataforma necesitamos confirmar que este correo es tuyo.</p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${url}"
           style="background: #534ab7; color: #eeedfe; padding: 12px 24px; text-decoration: none; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; font-size: 13px;">
          Verificar correo
        </a>
      </p>
      <p style="font-size: 13px; color: #6b8caa;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${url}" style="color: #534ab7;">${url}</a>
      </p>
      <p style="font-size: 12px; color: #6b8caa; margin-top: 32px;">
        El enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
      </p>
    </div>
  `;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Verifica tu correo · Legends cEDH",
    text: `Hola ${user.username}, confirma tu correo entrando en este enlace (válido 24 horas):\n\n${url}\n\nSi no creaste la cuenta, ignora este mensaje.`,
    html,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  sendVerificationEmail,
  buildVerificationToken,
  verifyVerificationToken,
};
