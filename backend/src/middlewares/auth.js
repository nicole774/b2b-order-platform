const jwt = require('jsonwebtoken');

// Vérifie le JWT envoyé dans l'en-tête : Authorization: Bearer <token>
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const token = header.slice(7); // retire "Bearer "

  try {
    // Lance une erreur si la signature est fausse ou si le token a expiré
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

// À utiliser après authenticate : vérifie que l'utilisateur a l'un des rôles autorisés
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };