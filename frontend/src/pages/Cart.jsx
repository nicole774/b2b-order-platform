import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import { formatPrice } from '../format.js'

function Cart() {
  const [cart, setCart] = useState(null)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('/cart')
      .then(setCart)
      .catch((err) => setError(err.message))
  }, [])

  async function updateQuantity(item, quantity) {
    if (quantity < 1) return
    setError('')
    try {
      setCart(await api(`/cart/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeItem(item) {
    setError('')
    try {
      setCart(await api(`/cart/items/${item.id}`, { method: 'DELETE' }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function placeOrder() {
    setError('')
    setSubmitting(true)
    try {
      const created = await api('/orders', { method: 'POST' })
      setOrder(created)
      setCart({ ...cart, items: [], total: 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!cart && !error) return <p>Chargement…</p>

  return (
    <>
      <h1>Mon panier</h1>

      {error && <p className="error" role="alert">{error}</p>}

      {order && (
        <div className="card success-card" role="status">
          <h2>Commande n°{order.id} enregistrée</h2>
          <p>
            Total : {formatPrice(order.total)}. Facture {order.invoice.number}.
          </p>
        </div>
      )}

      {cart && cart.items.length === 0 && !order && (
        <p>
          Votre panier est vide. <Link to="/">Voir le catalogue</Link>
        </p>
      )}

      {cart && cart.items.length > 0 && (
        <div className="card">
          <ul className="cart-list">
            {cart.items.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <strong>{item.product.name}</strong>
                  <span className="reference">{formatPrice(item.product.price)} l'unité</span>
                </div>

                <div className="quantity">
                  <button
                    type="button"
                    aria-label={`Retirer un ${item.product.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Ajouter un ${item.product.name}`}
                    disabled={item.quantity >= item.product.stockQuantity}
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <span className="line-total">{formatPrice(item.product.price * item.quantity)}</span>

                <button type="button" className="button-danger" onClick={() => removeItem(item)}>
                  Supprimer
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-footer">
            <p className="cart-total">Total : {formatPrice(cart.total)}</p>
            <button type="button" className="button-accent" disabled={submitting} onClick={placeOrder}>
              {submitting ? 'Commande en cours…' : 'Passer la commande'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Cart
