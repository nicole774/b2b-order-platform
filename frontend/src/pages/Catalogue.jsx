import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import Toast from '../Toast.jsx'
import Pagination from '../Pagination.jsx'
import { useAuth } from '../AuthContext.jsx'
import { formatPrice } from '../format.js'

const LOW_STOCK = 5

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-out">Rupture de stock</span>
  if (stock <= LOW_STOCK) return <span className="badge badge-low">Plus que {stock} en stock</span>
  return <span className="badge badge-ok">{stock} en stock</span>
}

function Catalogue() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams({ limit: 12, page, search: query })
    api('/products?' + params)
      .then((result) => {
        setProducts(result.data)
        setPages(result.meta.pages)
      })
      .catch((err) => setError(err.message))
  }, [query, page])

  function handleSearch(event) {
    event.preventDefault()
    setQuery(search)
    setPage(1)
  }

  async function addToCart(product) {
    setError('')
    setMessage('')
    try {
      await api('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      setMessage(`« ${product.name} » a été ajouté au panier.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Catalogue</h1>
        <form className="search" onSubmit={handleSearch} role="search">
          <label className="visually-hidden" htmlFor="search">Rechercher un produit</label>
          <input
            id="search"
            type="search"
            placeholder="Rechercher un produit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Rechercher</button>
        </form>
      </div>

      <Toast message={error} type="error" onClose={setError} />
      <Toast message={message} onClose={setMessage} />

      {products.length === 0 && !error && <p>Aucun produit trouvé.</p>}

      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="card product-card">
            <p className="reference">{product.reference}</p>
            <h2>{product.name}</h2>
            {product.description && <p className="description">{product.description}</p>}
            <p className="price">{formatPrice(product.price)}</p>
            <StockBadge stock={product.stockQuantity} />

            {user?.role === 'CLIENT' && (
              <button
                type="button"
                className="button-accent"
                disabled={product.stockQuantity === 0}
                onClick={() => addToCart(product)}
              >
                Ajouter au panier
              </button>
            )}
          </article>
        ))}
      </div>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {!user && (
        <p className="hint">
          <Link to="/connexion">Connectez-vous</Link> pour passer commande.
        </p>
      )}
    </>
  )
}

export default Catalogue
