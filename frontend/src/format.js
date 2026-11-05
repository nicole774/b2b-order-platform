// L'API renvoie les prix en texte ("24.90") à cause du type Decimal
export function formatPrice(value) {
  return Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR')
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

export const STATUS_LABELS = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  CANCELLED: 'Annulée',
}
