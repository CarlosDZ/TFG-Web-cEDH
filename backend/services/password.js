const argon2 = require("argon2");
const crypto = require("crypto");

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024, // 64 MB
  timeCost: 3,
  parallelism: 1,
};

function getPepper() {
  const pepper = process.env.PASSWORD_PEPPER;
  if (!pepper) throw new Error("PASSWORD_PEPPER no está configurado en .env");
  return pepper;
}

// Devuelve true si el hash es SHA256 (hex de 64 chars, sin prefijo argon2)
function isLegacySha256Hash(hash) {
  return /^[0-9a-f]{64}$/.test(hash);
}

async function hashPassword(password, salt) {
  const pepper = getPepper();
  const input = pepper + password + salt;
  return await argon2.hash(input, ARGON2_OPTIONS);
}

async function verifyPassword(password, salt, storedHash) {
  if (isLegacySha256Hash(storedHash)) {
    // Verificación legacy SHA256 (sin pepper, ya que no existía antes)
    const legacyHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    return legacyHash === storedHash;
  }
  const pepper = getPepper();
  const input = pepper + password + salt;
  return await argon2.verify(storedHash, input);
}

module.exports = { hashPassword, verifyPassword, isLegacySha256Hash };
