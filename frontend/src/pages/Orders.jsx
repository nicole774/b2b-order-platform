import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import { formatDate, formatPrice, STATUS_LABELS } from '../format.js'

function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/orders')
      .then(setOrders)
      .catch((err) => setError(err.message))
  }, [])

  if (!orders && !error) return <p>Chargement…</p>

  return (
    <>
      <h1>Mes commandes</h1>

      {error && <p className="error" role="alert">{error}</p>}

      {orders && orders.length === 0 && (
        <p>
          Vous n'avez pas encore passé de commande. <Link to="/">Voir le catalogue</Link>
        </p>
      )}

      <div className="order-list">
        {orders?.map((order) => (
          <details key={order.id} className="card order-card">
            <summary>
              <span className="order-title">Commande n°{order.id}</span>
              <span>{formatDate(order.createdAt)}</span>
              <span className={`status status-${order.status.toLowerCase()}`}>
                {STATUS_LABELS[order.status]}
              </span>
              <strong>{formatPrice(order.total)}</strong>
            </summary>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} × {item.product.name} à {formatPrice(item.unitPrice)}
                </li>
              ))}
            </ul>
            {order.invoice && (
              <p className="reference">
                Facture {order.invoice.number} du {formatDate(order.invoice.issuedAt)}
              </p>
            )}
          </details>
        ))}
      </div>
    </>
  )
}

export default Orders
