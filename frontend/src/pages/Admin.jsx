import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import Toast from '../Toast.jsx'
import Pagination from '../Pagination.jsx'
import { formatDate, formatDateTime, formatPrice, STATUS_LABELS } from '../format.js'

const LOW_STOCK = 5
const PER_PAGE = 20
const EMPTY_PRODUCT = { reference: '', name: '', description: '', price: '', stockQuantity: '' }

// Prisma renvoie description = null, mais zod attend une chaîne ou rien
function toPayload(product) {
  return JSON.stringify({
    reference: product.reference,
    name: product.name,
    description: product.description || undefined,
    price: product.price,
    stockQuantity: product.stockQuantity,
  })
}

function ProductRow({ product, onSaved, onDeleted, onError }) {
  const [price, setPrice] = useState(product.price)
  const [stock, setStock] = useState(product.stockQuantity)

  async function save() {
    try {
      const updated = await api(`/products/${product.id}`, {
        method: 'PUT',
        body: toPayload({ ...product, price, stockQuantity: stock }),
      })
      onSaved(updated)
    } catch (err) {
      onError(err.message)
    }
  }

  async function remove() {
    if (!window.confirm(`Supprimer « ${product.name} » ?`)) return
    try {
      await api(`/products/${product.id}`, { method: 'DELETE' })
      onDeleted(product.id)
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <tr>
      <td>{product.reference}</td>
      <td>{product.name}</td>
      <td>
        <input
          type="number"
          step="0.01"
          min="0.01"
          aria-label={`Prix de ${product.name}`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          aria-label={`Stock de ${product.name}`}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </td>
      <td className="actions">
        <button type="button" onClick={save}>Enregistrer</button>
        <button type="button" className="button-danger" onClick={remove}>Supprimer</button>
      </td>
    </tr>
  )
}

function AdminProducts({ products, setProducts, search, setSearch, page, pages, setPage }) {
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function showError(text) {
    setMessage('')
    setError(text)
  }

  function handleSaved(updated) {
    setError('')
    setProducts(products.map((p) => (p.id === updated.id ? updated : p)))
    setMessage(`« ${updated.name} » a été modifié.`)
  }

  function handleDeleted(id) {
    setError('')
    setProducts(products.filter((p) => p.id !== id))
    setMessage('Produit supprimé.')
  }

  // Fenêtre native <dialog> : showModal() gère le fond grisé, la touche Échap
  // et garde le focus du clavier à l'intérieur
  const dialogRef = useRef(null)
  const [formError, setFormError] = useState('')

  function openDialog() {
    setForm(EMPTY_PRODUCT)
    setFormError('')
    dialogRef.current.showModal()
  }

  function closeDialog() {
    dialogRef.current.close()
  }

  async function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    setError('')
    setMessage('')
    try {
      const created = await api('/products', { method: 'POST', body: toPayload(form) })
      setProducts([created, ...products])
      closeDialog()
      setMessage(`« ${created.name} » a été ajouté.`)
    } catch (err) {
      // La fenêtre passe au-dessus de tout : l'erreur s'affiche dedans, pas dans le toast
      setFormError(err.message)
    }
  }

  // Mêmes règles que la validation zod du backend
  const price = Number(form.price)
  const stock = Number(form.stockQuantity)
  const isValid =
    form.reference.trim() !== '' &&
    form.name.trim() !== '' &&
    form.price !== '' && price > 0 &&
    form.stockQuantity !== '' && Number.isInteger(stock) && stock >= 0

  function updateField(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  return (
    <section>
      <Toast message={error} type="error" onClose={setError} />
      <Toast message={message} onClose={setMessage} />

      <div className="toolbar">
        <label className="filter">
          Rechercher
          <input
            type="search"
            placeholder="Nom ou référence"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button type="button" className="button-accent" onClick={openDialog}>
          + Ajouter un produit
        </button>
      </div>

      {search && products.length === 0 && <p>Aucun produit ne correspond à « {search} ».</p>}

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Prix (€)</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
                onError={showError}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <dialog ref={dialogRef} className="dialog" aria-labelledby="dialog-title">
        <form className="product-form" onSubmit={handleCreate}>
          <div className="dialog-header">
            <h2 id="dialog-title">Ajouter un produit</h2>
            <button type="button" className="dialog-close" aria-label="Fermer" onClick={closeDialog}>×</button>
          </div>
          {formError && <p className="error" role="alert">{formError}</p>}
          <p className="form-note">Les champs marqués d'un <span className="required" aria-hidden="true">*</span> sont obligatoires.</p>
          <div className="form-grid">
            <label>
              <span>Référence <span className="required" aria-hidden="true">*</span></span>
              <input value={form.reference} onChange={updateField('reference')} required />
            </label>
            <label>
              <span>Nom <span className="required" aria-hidden="true">*</span></span>
              <input value={form.name} onChange={updateField('name')} required />
            </label>
            <label>
              <span>Prix (€) <span className="required" aria-hidden="true">*</span></span>
              <input type="number" step="0.01" min="0.01" value={form.price} onChange={updateField('price')} required />
            </label>
            <label>
              <span>Stock <span className="required" aria-hidden="true">*</span></span>
              <input type="number" min="0" value={form.stockQuantity} onChange={updateField('stockQuantity')} required />
            </label>
          </div>
          <label>
            <span>Description <span className="optional">(facultatif)</span></span>
            <input value={form.description} onChange={updateField('description')} />
          </label>
          <div className="dialog-actions">
            <button type="button" className="tab" onClick={closeDialog}>Annuler</button>
            <button type="submit" className={isValid ? 'button-accent' : 'button-incomplete'}>
              Ajouter le produit
            </button>
          </div>
        </form>
      </dialog>
    </section>
  )
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  // Filtrage dans la page : n° de commande, client (nom ou e-mail) ou n° de facture
  const text = query.trim().toLowerCase()
  const filtered = orders.filter((order) => {
    if (status && order.status !== status) return false
    if (!text) return true
    return [String(order.id), order.user?.name, order.user?.email, order.invoice?.number]
      .some((value) => value && value.toLowerCase().includes(text))
  })

  // Toutes les commandes sont déjà chargées : on découpe la liste filtrée en pages
  const pages = Math.ceil(filtered.length / PER_PAGE)
  const pageOrders = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => {
    api('/orders')
      .then(setOrders)
      .catch((err) => setError(err.message))
  }, [])

  async function changeStatus(order, status) {
    setError('')
    try {
      const updated = await api(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setOrders(orders.map((o) => (o.id === updated.id ? updated : o)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <Toast message={error} type="error" onClose={setError} />
      {orders.length === 0 && !error && <p>Aucune commande pour l'instant.</p>}

      {orders.length > 0 && (
        <div className="filters">
          <label className="filter">
            Rechercher
            <input
              type="search"
              placeholder="N°, client ou facture"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            />
          </label>
          <label className="filter">
            Statut
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {orders.length > 0 && filtered.length === 0 && <p>Aucune commande ne correspond à la recherche.</p>}

      {filtered.length > 0 && (
        <div className="table-wrapper card">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Facture</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => {
                const locked = order.status === 'SHIPPED' || order.status === 'CANCELLED'
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.user?.name}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>{order.invoice?.number}</td>
                    <td>
                      <select
                        aria-label={`Statut de la commande ${order.id}`}
                        value={order.status}
                        disabled={locked}
                        onChange={(e) => changeStatus(order, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />
    </section>
  )
}

function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [action, setAction] = useState('')
  const [email, setEmail] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  // Le journal grossit vite : filtres et pages sont gérés par l'API
  useEffect(() => {
    const params = new URLSearchParams({ limit: PER_PAGE, page })
    if (action) params.set('action', action)
    if (email.trim()) params.set('email', email.trim())
    const timer = setTimeout(() => {
      api('/admin/audit-logs?' + params)
        .then(setLogs)
        .catch((err) => setError(err.message))
    }, email ? 300 : 0)
    return () => clearTimeout(timer)
  }, [action, email, page])

  return (
    <section>
      <div className="filters">
        <label className="filter">
          Rechercher
          <input
            type="search"
            placeholder="E-mail de l'utilisateur"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setPage(1) }}
          />
        </label>
        <label className="filter">
          Filtrer par action
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}>
            <option value="">Toutes</option>
            <option value="REGISTER">REGISTER</option>
            <option value="LOGIN">LOGIN</option>
            <option value="ADD_TO_CART">ADD_TO_CART</option>
            <option value="CREATE_ORDER">CREATE_ORDER</option>
            <option value="UPDATE_ORDER_STATUS">UPDATE_ORDER_STATUS</option>
            <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
            <option value="UPDATE_PRODUCT">UPDATE_PRODUCT</option>
            <option value="DELETE_PRODUCT">DELETE_PRODUCT</option>
          </select>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {logs.length === 0 && !error && <p>Aucune action ne correspond.</p>}

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Élément</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.createdAt)}</td>
                <td>{log.user ? log.user.email : '—'}</td>
                <td>{log.action}</td>
                <td>{log.entity}{log.entityId ? ` n°${log.entityId}` : ''}</td>
                <td className="details">{log.details ? JSON.stringify(log.details) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* L'API ne donne pas le total : s'il y a 20 lignes, il y a peut-être une page suivante */}
      <Pagination page={page} hasNext={logs.length === PER_PAGE} onChange={setPage} />
    </section>
  )
}

const TABS = [
  { id: 'products', label: 'Produits et stock' },
  { id: 'orders', label: 'Commandes' },
  { id: 'logs', label: "Journal d'audit" },
]

function Admin() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [lowStock, setLowStock] = useState([])

  // On attend 300 ms après la dernière touche pour ne pas appeler l'API à chaque lettre
  useEffect(() => {
    const params = new URLSearchParams({ limit: PER_PAGE, page, search: search.trim() })
    const timer = setTimeout(() => {
      api('/products?' + params)
        .then((result) => {
          setProducts(result.data)
          setPages(result.meta.pages)
        })
        .catch((err) => setError(err.message))
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, page])

  // L'alerte porte sur tout le stock, pas seulement sur la page affichée.
  // Elle est rechargée à chaque changement de la liste (ajout, modification, suppression).
  useEffect(() => {
    api('/products?limit=50&maxStock=' + LOW_STOCK)
      .then((result) => setLowStock(result.data))
      .catch((err) => setError(err.message))
  }, [products])

  function changeSearch(value) {
    setSearch(value)
    setPage(1)
  }

  return (
    <>
      <h1>Administration</h1>

      {error && <p className="error" role="alert">{error}</p>}

      {lowStock.length > 0 && (
        // Repliée par défaut : avec beaucoup de produits, la liste ne pousse pas le tableau vers le bas
        <details className="card alert" role="status">
          <summary>
            Stock bas : {lowStock.length} produit{lowStock.length > 1 ? 's' : ''} à réapprovisionner
          </summary>
          <ul>
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name} : {p.stockQuantity === 0 ? 'rupture de stock' : `${p.stockQuantity} restant(s)`}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab tab-active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <AdminProducts
          products={products}
          setProducts={setProducts}
          search={search}
          setSearch={changeSearch}
          page={page}
          pages={pages}
          setPage={setPage}
        />
      )}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'logs' && <AdminLogs />}
    </>
  )
}

export default Admin
