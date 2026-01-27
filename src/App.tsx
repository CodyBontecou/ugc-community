import { motion, useScroll, useTransform } from 'motion/react'
import {
  Sparkles,
  Palette,
  Globe,
  Zap,
  MessageCircle,
  BarChart3,
  Check,
  ArrowRight,
  Play,
  Star,
  Heart,
  Instagram,
  Youtube,
  Camera
} from 'lucide-react'
import './App.css'

function App() {
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  return (
    <div className="app">
      {/* Floating Background Elements */}
      <div className="background-decor">
        <motion.div
          className="blob blob-1"
          style={{ y: backgroundY }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blob blob-2"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -15, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="blob blob-3"
          animate={{
            scale: [1, 1.08, 1],
            x: [0, 30, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav-container">
          <a href="/" className="logo">
            <div className="logo-icon">
              <span>u</span>
            </div>
            <span className="logo-text">ugc.community</span>
          </a>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#portfolios">Examples</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="nav-actions">
            <a href="#" className="nav-link-signin">Sign in</a>
            <motion.a
              href="#pricing"
              className="btn btn-primary btn-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles size={14} />
            <span>Trusted by 2,000+ creators</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Your UGC portfolio,
            <br />
            <span className="gradient-text">beautifully crafted</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Create a stunning portfolio that showcases your content and lands you
            brand deals. Your own corner of the internet at <em>yourname</em>.ugc.community
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.a
              href="#pricing"
              className="btn btn-primary btn-lg"
              whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(255, 107, 149, 0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              Start Building Free
              <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="#portfolios"
              className="btn btn-ghost btn-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} />
              See Examples
            </motion.a>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="browser-mockup">
              <div className="browser-header">
                <div className="browser-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="browser-url">
                  <Globe size={12} />
                  <span>dany.ugc.community</span>
                </div>
              </div>
              <div className="browser-content">
                <PortfolioPreview />
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              className="floating-card card-stats"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <BarChart3 size={20} className="card-icon" />
              <div>
                <span className="card-value">847</span>
                <span className="card-label">Profile Views</span>
              </div>
            </motion.div>

            <motion.div
              className="floating-card card-message"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="message-avatar">B</div>
              <div>
                <span className="card-label">Brand Inquiry</span>
                <span className="card-text">"Love your content! Let's collab..."</span>
              </div>
            </motion.div>

            <motion.div
              className="floating-card card-social"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <Instagram size={16} />
              <span>245K</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="container">
          <motion.p
            className="social-proof-text"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Join creators already using ugc.community
          </motion.p>
          <div className="creator-avatars">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <motion.div
                key={i}
                className="creator-avatar"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: `linear-gradient(135deg,
                    hsl(${(i * 40) % 360}, 70%, 70%),
                    hsl(${(i * 40 + 60) % 360}, 60%, 60%))`
                }}
              />
            ))}
            <div className="creator-avatar creator-avatar-more">+1.2k</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Features</span>
            <h2 className="section-title">
              Everything you need to
              <br />
              <span className="gradient-text">stand out</span>
            </h2>
            <p className="section-subtitle">
              Built specifically for UGC creators. No coding required.
            </p>
          </motion.div>

          <div className="features-grid">
            {[
              {
                icon: <Palette size={24} />,
                title: "Beautiful Templates",
                description: "Stunning, mobile-first designs crafted specifically for showcasing UGC content and video portfolios."
              },
              {
                icon: <Globe size={24} />,
                title: "Your Own Subdomain",
                description: "Get a professional URL like sarah.ugc.community that's easy to share with brands and clients."
              },
              {
                icon: <Zap size={24} />,
                title: "Lightning Fast",
                description: "Optimized for speed so brands never wait. Your portfolio loads instantly on any device."
              },
              {
                icon: <MessageCircle size={24} />,
                title: "Built-in Contact Form",
                description: "Let brands reach you directly. Get notifications instantly when someone wants to work with you."
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Analytics Dashboard",
                description: "See who's viewing your portfolio, where they're from, and which content performs best."
              },
              {
                icon: <Heart size={24} />,
                title: "Made for Creators",
                description: "Every feature designed with UGC creators in mind. We understand your workflow."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Examples Section */}
      <section id="portfolios" className="portfolios">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Examples</span>
            <h2 className="section-title">
              See what creators
              <br />
              <span className="gradient-text">are building</span>
            </h2>
            <p className="section-subtitle">
              Get inspired by portfolios from our community of creators.
            </p>
          </motion.div>

          <div className="portfolio-showcase">
            {[
              { name: "Dany", handle: "dany", niche: "Lifestyle & Beauty", followers: "245K", gradient: "linear-gradient(135deg, #FF9A8B, #FF6B95)" },
              { name: "Marcus", handle: "marcus", niche: "Tech Reviews", followers: "189K", gradient: "linear-gradient(135deg, #667eea, #764ba2)" },
              { name: "Sophia", handle: "sophia", niche: "Food & Recipe", followers: "412K", gradient: "linear-gradient(135deg, #f093fb, #f5576c)" },
            ].map((creator, i) => (
              <motion.div
                key={i}
                className="portfolio-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="portfolio-preview" style={{ background: creator.gradient }}>
                  <div className="portfolio-avatar">
                    <Camera size={24} />
                  </div>
                  <div className="portfolio-content-preview">
                    <div className="video-thumb" />
                    <div className="video-thumb" />
                    <div className="video-thumb" />
                  </div>
                </div>
                <div className="portfolio-info">
                  <div className="portfolio-header">
                    <div>
                      <h3>{creator.name}</h3>
                      <span className="portfolio-url">{creator.handle}.ugc.community</span>
                    </div>
                    <div className="portfolio-followers">
                      <Instagram size={14} />
                      <span>{creator.followers}</span>
                    </div>
                  </div>
                  <p className="portfolio-niche">{creator.niche}</p>
                  <a href="#" className="portfolio-link">
                    Visit Portfolio <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">
              Live in minutes,
              <br />
              <span className="gradient-text">not days</span>
            </h2>
          </motion.div>

          <div className="steps">
            {[
              { step: "01", title: "Choose Your Style", description: "Pick from our collection of stunning templates designed for UGC creators." },
              { step: "02", title: "Add Your Content", description: "Upload your best UGC videos and photos. Connect your socials for auto-sync." },
              { step: "03", title: "Go Live", description: "Publish to your custom subdomain and start sharing with brands." }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="step"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
              >
                <div className="step-number">{item.step}</div>
                <div className="step-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">
              Loved by
              <br />
              <span className="gradient-text">creators</span>
            </h2>
          </motion.div>

          <div className="testimonials-grid">
            {[
              {
                quote: "I landed 3 brand deals in my first month after launching my ugc.community portfolio. The design is so professional!",
                author: "Jessica K.",
                role: "Beauty Creator",
                rating: 5
              },
              {
                quote: "Finally a portfolio builder that actually understands UGC creators. The analytics help me show brands my real impact.",
                author: "Marcus T.",
                role: "Tech Reviewer",
                rating: 5
              },
              {
                quote: "Setting up took 10 minutes. Now I just send brands my link and they're immediately impressed. Worth every penny.",
                author: "Sophia M.",
                role: "Lifestyle Creator",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{
                    background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 70%), hsl(${i * 60 + 40}, 60%, 60%))`
                  }} />
                  <div>
                    <span className="testimonial-name">{testimonial.author}</span>
                    <span className="testimonial-role">{testimonial.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Pricing</span>
            <h2 className="section-title">
              Simple pricing,
              <br />
              <span className="gradient-text">no surprises</span>
            </h2>
            <p className="section-subtitle">
              Start free, upgrade when you're ready to grow.
            </p>
          </motion.div>

          <div className="pricing-grid">
            {/* Free Tier */}
            <motion.div
              className="pricing-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="pricing-header">
                <h3>Starter</h3>
                <p className="pricing-description">Perfect for getting started</p>
                <div className="pricing-amount">
                  <span className="price">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={18} /> 1 portfolio page</li>
                <li><Check size={18} /> 5 video uploads</li>
                <li><Check size={18} /> Basic templates</li>
                <li><Check size={18} /> yourname.ugc.community</li>
                <li><Check size={18} /> Contact form</li>
              </ul>
              <motion.button
                className="btn btn-secondary btn-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started Free
              </motion.button>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              className="pricing-card pricing-card-featured"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Creator Pro</h3>
                <p className="pricing-description">For serious creators</p>
                <div className="pricing-amount">
                  <span className="price">$12</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={18} /> Unlimited pages</li>
                <li><Check size={18} /> Unlimited uploads</li>
                <li><Check size={18} /> Premium templates</li>
                <li><Check size={18} /> Analytics dashboard</li>
                <li><Check size={18} /> Custom branding</li>
                <li><Check size={18} /> Priority support</li>
                <li><Check size={18} /> Remove ugc.community badge</li>
              </ul>
              <motion.button
                className="btn btn-primary btn-full"
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(255, 107, 149, 0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                Start 14-day Free Trial
              </motion.button>
            </motion.div>

            {/* Agency Tier */}
            <motion.div
              className="pricing-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="pricing-header">
                <h3>Agency</h3>
                <p className="pricing-description">For teams & managers</p>
                <div className="pricing-amount">
                  <span className="price">$49</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={18} /> Everything in Pro</li>
                <li><Check size={18} /> Up to 10 creator profiles</li>
                <li><Check size={18} /> Team collaboration</li>
                <li><Check size={18} /> White-label option</li>
                <li><Check size={18} /> API access</li>
                <li><Check size={18} /> Dedicated support</li>
              </ul>
              <motion.button
                className="btn btn-secondary btn-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Sales
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to level up your creator game?</h2>
            <p>Join thousands of UGC creators who've already made the switch.</p>
            <motion.a
              href="#pricing"
              className="btn btn-white btn-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Your Portfolio
              <ArrowRight size={18} />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="/" className="logo">
                <div className="logo-icon">
                  <span>u</span>
                </div>
                <span className="logo-text">ugc.community</span>
              </a>
              <p>The modern way for content creators to showcase their work and land brand deals.</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                <a href="#" aria-label="YouTube"><Youtube size={20} /></a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#portfolios">Examples</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Templates</a>
            </div>

            <div className="footer-links">
              <h4>Resources</h4>
              <a href="#">Help Center</a>
              <a href="#">Blog</a>
              <a href="#">Guides</a>
              <a href="#">API Docs</a>
            </div>

            <div className="footer-links">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2025 ugc.community. Made with love for creators.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* Inline Portfolio Preview Component */
function PortfolioPreview() {
  return (
    <div className="portfolio-demo">
      <div className="demo-header">
        <div className="demo-avatar" />
        <div className="demo-info">
          <div className="demo-name">Dany</div>
          <div className="demo-tagline">Lifestyle & Beauty Creator</div>
        </div>
      </div>
      <div className="demo-stats">
        <div className="demo-stat">
          <Instagram size={14} />
          <span>245K</span>
        </div>
        <div className="demo-stat">
          <Youtube size={14} />
          <span>89K</span>
        </div>
        <div className="demo-stat">
          <Camera size={14} />
          <span>120+</span>
        </div>
      </div>
      <div className="demo-grid">
        <div className="demo-video demo-video-featured" />
        <div className="demo-video" />
        <div className="demo-video" />
        <div className="demo-video" />
      </div>
      <div className="demo-cta">
        <span>Work With Me</span>
        <ArrowRight size={14} />
      </div>
    </div>
  )
}

export default App
