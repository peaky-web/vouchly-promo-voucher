import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './lib/supabase'
import {
  ArrowRight, Check, ChevronDown, Clock3, Copy, Gift, LogIn,
  Menu, Sparkles, Ticket, UserPlus, X
} from 'lucide-react'
import './styles.css'

const fallbackVouchers = [
  { id: 1, restaurant: "McDonald's", title: '₱100 OFF', description: 'Get ₱100 off your qualifying order.', discount: '₱100 OFF', category: 'Burgers', accent: '#ffb000', expires_at: '2026-12-31', voucher_code: 'MCD100-DEMO' },
  { id: 2, restaurant: 'Jollibee', title: 'Free Peach Mango Pie', description: 'Enjoy a free Peach Mango Pie with a qualifying meal.', discount: 'FREE PIE', category: 'Chicken', accent: '#e53935', expires_at: '2026-11-30', voucher_code: 'JBL-PIE-DEMO' },
  { id: 3, restaurant: 'KFC', title: '20% OFF Bucket Meal', description: 'Save 20% on selected bucket meals.', discount: '20% OFF', category: 'Chicken', accent: '#c62828', expires_at: '2026-12-15', voucher_code: 'KFC20-DEMO' },
  { id: 4, restaurant: 'Burger King', title: '₱80 OFF Whopper', description: 'Take ₱80 off a qualifying Whopper meal.', discount: '₱80 OFF', category: 'Burgers', accent: '#f4511e', expires_at: '2026-10-31', voucher_code: 'BK80-DEMO' },
]

const restaurantEmoji = {
  "McDonald's": '🍔',
  'Jollibee': '🍗',
  'KFC': '🍟',
  'Burger King': '👑'
}

function App() {
  const [vouchers, setVouchers] = useState(fallbackVouchers)

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('vouchlyUser') || 'null')
  )

  // Claims now come directly from Supabase for the CURRENT USER.
  const [claims, setClaims] = useState([])

  const [modal, setModal] = useState(null)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  const [authMode, setAuthMode] = useState('signup')
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadVouchers()
  }, [])

  // When the logged-in user changes, load ONLY that user's claims.
  useEffect(() => {
    if (user) {
      localStorage.setItem('vouchlyUser', JSON.stringify(user))
      loadUserClaims(user.id)
    } else {
      localStorage.removeItem('vouchlyUser')
      setClaims([])
    }
  }, [user])

  async function loadVouchers() {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('id')

    if (!error && data?.length) {
      setVouchers(data)
    }
  }

  // IMPORTANT:
  // Only retrieve claims belonging to the currently logged-in user.
  async function loadUserClaims(userId) {
    if (!userId) {
      setClaims([])
      return
    }

    const { data, error } = await supabase
      .from('claims')
      .select('id, user_id, voucher_id, claimed_at')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false })

    if (error) {
      showToast(error.message)
      setClaims([])
      return
    }

    setClaims(data || [])
  }

  function openClaim(voucher) {
    setSelectedVoucher(voucher)

    if (!user) {
      setAuthMode('signup')
      setModal('auth')
    } else {
      claimVoucher(voucher)
    }
  }

  async function register(username, password) {
    const clean = username.trim()

    if (!clean || !password) {
      return showToast('Please complete both fields.')
    }

    if (password.length < 4) {
      return showToast('Use at least 4 characters for the demo password.')
    }

    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('username', clean)
      .maybeSingle()

    if (existingError) {
      return showToast(existingError.message)
    }

    if (existing) {
      return showToast('That username is already registered.')
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: clean,
        password
      })
      .select()
      .single()

    if (error) {
      return showToast(error.message)
    }

    setUser({
      id: data.id,
      username: data.username
    })

    setModal(null)

    showToast('Account created. You are now signed in.')
  }

  async function login(username, password) {
    const clean = username.trim()

    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', clean)
      .eq('password', password)
      .maybeSingle()

    if (error) {
      return showToast(error.message)
    }

    if (!data) {
      return showToast('Incorrect username or password.')
    }

    setUser(data)
    setModal(null)

    showToast('Welcome back!')
  }

  async function claimVoucher(voucher) {
    if (!user) return

    // IMPORTANT:
    // Check BOTH the current user's ID AND the voucher ID.
    //
    // This means:
    // demo1 + McDonald's = claimed
    // demo2 + McDonald's = NOT claimed yet
    //
    const alreadyClaimed = claims.some(
      claim =>
        Number(claim.user_id) === Number(user.id) &&
        Number(claim.voucher_id) === Number(voucher.id)
    )

    if (alreadyClaimed) {
      setSelectedVoucher(voucher)
      setModal('claimed')
      return
    }

    // Save the claim specifically for the current user.
    const { error } = await supabase
      .from('claims')
      .insert({
        user_id: user.id,
        voucher_id: voucher.id
      })

    if (error) {
      // The database UNIQUE(user_id, voucher_id) constraint
      // protects against duplicate claims.
      if (error.message.toLowerCase().includes('duplicate')) {
        await loadUserClaims(user.id)
        setSelectedVoucher(voucher)
        setModal('claimed')
        return
      }

      return showToast(error.message)
    }

    // Reload claims from Supabase.
    await loadUserClaims(user.id)

    setSelectedVoucher(voucher)
    setModal('claimed')
  }

  function logout() {
    setUser(null)
    setClaims([])
    setModal(null)

    showToast('You have been logged out.')
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  function switchAuth(mode) {
    setAuthMode(mode)
    setModal('auth')
  }

  return (
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-icon">
            <Ticket size={20} />
          </span>
          <span>Vouchly</span>
        </a>

        <button
          className="menu-button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Open menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#vouchers" onClick={() => setMenuOpen(false)}>
            Vouchers
          </a>

          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>

          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>

          {user ? (
            <button
              className="profile-button"
              onClick={() => setModal('account')}
            >
              <span className="avatar">
                {user.username.slice(0, 1).toUpperCase()}
              </span>

              {user.username}
            </button>
          ) : (
            <button
              className="outline-button"
              onClick={() => {
                switchAuth('login')
                setMenuOpen(false)
              }}
            >
              <LogIn size={17} />
              Log in
            </button>
          )}
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy reveal">
            <div className="eyebrow">
              <Sparkles size={15} />
              Fresh deals, made simple
            </div>

            <h1>
              Good food.
              <br />
              <span>Better deals.</span>
            </h1>

            <p>
              Discover limited-time restaurant vouchers and save on the meals
              you already love.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#vouchers">
                Explore vouchers
                <ArrowRight size={18} />
              </a>

              <a className="text-button" href="#how">
                How it works
                <ChevronDown size={17} />
              </a>
            </div>

            <div className="trust-row">
              <span>
                <Check size={15} />
                Easy to claim
              </span>

              <span>
                <Check size={15} />
                No complicated forms
              </span>
            </div>
          </div>

          <div className="hero-ticket reveal delay-one">
            <div className="floating-tag tag-one">
              🔥 Popular
            </div>

            <div className="floating-tag tag-two">
              Limited time
            </div>

            <div className="ticket-card">
              <div className="ticket-top">
                <div className="food-logo">🍔</div>
                <span>VOUCHLY PICK</span>
              </div>

              <div className="ticket-main">
                <small>McDonald's</small>
                <strong>₱100 OFF</strong>
                <p>on selected orders</p>
              </div>

              <div className="ticket-divider">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              <div className="ticket-bottom">
                <span>LIMITED OFFER</span>
                <b>MCD100-DEMO</b>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-strip">
          <div>
            <strong>{vouchers.length}+</strong>
            <span>featured deals</span>
          </div>

          <div>
            <strong>4</strong>
            <span>restaurant brands</span>
          </div>

          <div>
            <strong>1 tap</strong>
            <span>to claim</span>
          </div>
        </section>

        <section className="section" id="vouchers">
          <div className="section-heading">
            <div>
              <span className="section-label">
                TODAY'S DEALS
              </span>

              <h2>
                Pick your next <span>favorite.</span>
              </h2>
            </div>

            <p>
              Browse available offers. You only need an account when you're
              ready to claim.
            </p>
          </div>

          <div className="voucher-grid">
            {vouchers.map((voucher, index) => {

              // IMPORTANT:
              // Only this logged-in user determines whether
              // this voucher shows as "Claimed".
              const alreadyClaimed = claims.some(
                claim =>
                  Number(claim.user_id) === Number(user?.id) &&
                  Number(claim.voucher_id) === Number(voucher.id)
              )

              return (
                <article
                  className="voucher-card reveal"
                  style={{
                    '--accent': voucher.accent,
                    animationDelay: `${index * 80}ms`
                  }}
                  key={voucher.id}
                >
                  <div className="card-visual">
                    <span className="food-emoji">
                      {restaurantEmoji[voucher.restaurant] || '🍴'}
                    </span>

                    <span className="discount-pill">
                      {voucher.discount}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="restaurant">
                      {voucher.restaurant}
                    </div>

                    <h3>{voucher.title}</h3>

                    <p>{voucher.description}</p>

                    <div className="card-meta">
                      <span>
                        <Clock3 size={14} />
                        Until {formatDate(voucher.expires_at)}
                      </span>
                    </div>

                    <button
                      className={
                        alreadyClaimed
                          ? 'claim-button claimed'
                          : 'claim-button'
                      }
                      onClick={() => openClaim(voucher)}
                    >
                      {alreadyClaimed ? (
                        <>
                          <Check size={17} />
                          Claimed
                        </>
                      ) : (
                        <>
                          Claim voucher
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="how-section" id="how">
          <div className="section-heading centered">
            <span className="section-label">
              HOW IT WORKS
            </span>

            <h2>
              Three steps. <span>That's it.</span>
            </h2>
          </div>

          <div className="steps">
            <Step
              number="01"
              icon={<Gift />}
              title="Find a deal"
              text="Explore our collection of restaurant promotions and find something you want."
            />

            <Step
              number="02"
              icon={<UserPlus />}
              title="Create an account"
              text="When you click claim, sign up with a simple username and password."
            />

            <Step
              number="03"
              icon={<Ticket />}
              title="Claim & enjoy"
              text="Claim your voucher and keep it available in your account."
            />
          </div>
        </section>

        <section className="faq-section section" id="faq">
          <div className="section-heading centered">
            <span className="section-label">
              FAQ
            </span>

            <h2>
              Questions? <span>We've got you.</span>
            </h2>
          </div>

          <div className="faq-list">
            <Faq
              q="Can I browse without an account?"
              a="Yes. The public voucher catalog is available to everyone. An account is only required when you claim a voucher."
            />

            <Faq
              q="Do I need an email address?"
              a="No. This school demonstration uses a simple username and password flow."
            />

            <Faq
              q="Where can I see my claimed vouchers?"
              a="Click your username in the navigation bar after signing in to open your account and claimed voucher list."
            />

            <Faq
              q="Are these official restaurant vouchers?"
              a="This website is a school demonstration project. The offers shown are sample promotional data and are not presented as official offers from the restaurant brands."
            />
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span className="section-label">
              READY?
            </span>

            <h2>
              Find a deal worth
              <br />
              <span>saving for.</span>
            </h2>
          </div>

          <a
            href="#vouchers"
            className="primary-button light"
          >
            Browse vouchers
            <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <span className="brand-icon">
            <Ticket size={18} />
          </span>
          Vouchly
        </div>

        <p>
          School demonstration project · Promotional voucher concept
        </p>
      </footer>

      {modal === 'auth' && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setModal(null)}
          onLogin={login}
          onRegister={register}
        />
      )}

      {modal === 'claimed' && selectedVoucher && (
        <ClaimedModal
          voucher={selectedVoucher}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'account' && (
        <AccountModal
          user={user}
          vouchers={vouchers}
          claims={claims}
          onClose={() => setModal(null)}
          onLogout={logout}
        />
      )}

      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}

function Step({ number, icon, title, text }) {
  return (
    <div className="step-card reveal">
      <span className="step-number">{number}</span>

      <div className="step-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  )
}

function Faq({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={open ? 'faq-item open' : 'faq-item'}>
      <button onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <ChevronDown />
      </button>

      <div className="faq-answer">
        <p>{a}</p>
      </div>
    </div>
  )
}

function AuthModal({
  mode,
  setMode,
  onClose,
  onLogin,
  onRegister
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = e => {
    e.preventDefault()

    mode === 'login'
      ? onLogin(username, password)
      : onRegister(username, password)
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal auth-modal">
        <button
          className="close-button"
          onClick={onClose}
        >
          <X />
        </button>

        <div className="modal-icon">
          <Ticket />
        </div>

        <span className="section-label">
          {mode === 'login'
            ? 'WELCOME BACK'
            : 'JOIN VOUCHLY'}
        </span>

        <h2>
          {mode === 'login'
            ? 'Log in to claim.'
            : 'Create your account.'}
        </h2>

        <p>
          {mode === 'login'
            ? 'Enter your details to continue.'
            : 'It only takes a few seconds.'}
        </p>

        <form onSubmit={submit}>
          <label>
            Username

            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. foodlover"
              autoComplete="username"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
            />
          </label>

          <button
            className="primary-button full"
            type="submit"
          >
            {mode === 'login' ? (
              <>
                <LogIn size={17} />
                Log in
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Create account
              </>
            )}
          </button>
        </form>

        <div className="switch-auth">
          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}

          {' '}

          <button
            onClick={() =>
              setMode(
                mode === 'login'
                  ? 'signup'
                  : 'login'
              )
            }
          >
            {mode === 'login'
              ? 'Sign up'
              : 'Log in'}
          </button>
        </div>

        <small className="demo-note">
          School demonstration account. Do not use a real password.
        </small>
      </div>
    </div>
  )
}

function ClaimedModal({ voucher, onClose }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(
      voucher.voucher_code
    )

    setCopied(true)

    setTimeout(
      () => setCopied(false),
      1800
    )
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal claimed-modal">
        <button
          className="close-button"
          onClick={onClose}
        >
          <X />
        </button>

        <div className="success-icon">
          <Check />
        </div>

        <span className="section-label">
          VOUCHER CLAIMED
        </span>

        <h2>{voucher.title}</h2>

        <p>
          Your voucher is ready. Show the code when using the offer.
        </p>

        <div className="code-box">
          <span>{voucher.voucher_code}</span>

          <button onClick={copy}>
            {copied ? (
              <Check size={17} />
            ) : (
              <Copy size={17} />
            )}
          </button>
        </div>

        <button
          className="primary-button full"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function AccountModal({
  user,
  vouchers,
  claims,
  onClose,
  onLogout
}) {
  // IMPORTANT:
  // The claims state already contains ONLY this user's claims.
  // We still check user_id here for extra safety.
  const mine = vouchers.filter(v =>
    claims.some(
      claim =>
        Number(claim.user_id) === Number(user.id) &&
        Number(claim.voucher_id) === Number(v.id)
    )
  )

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="modal account-modal">
        <button
          className="close-button"
          onClick={onClose}
        >
          <X />
        </button>

        <div className="account-head">
          <div className="big-avatar">
            {user.username
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <span className="section-label">
              ACCOUNT
            </span>

            <h2>{user.username}</h2>
          </div>
        </div>

        <div className="claimed-heading">
          <span>My vouchers</span>
          <b>{mine.length}</b>
        </div>

        {mine.length ? (
          <div className="mini-vouchers">
            {mine.map(v => (
              <div
                className="mini-voucher"
                key={v.id}
              >
                <span>
                  {restaurantEmoji[v.restaurant] || '🍴'}
                </span>

                <div>
                  <b>{v.restaurant}</b>
                  <small>{v.title}</small>
                </div>

                <code>{v.voucher_code}</code>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            You haven't claimed a voucher yet.
          </div>
        )}

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function formatDate(value) {
  return new Date(
    value + 'T00:00:00'
  ).toLocaleDateString(
    'en-PH',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
  )
}

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)