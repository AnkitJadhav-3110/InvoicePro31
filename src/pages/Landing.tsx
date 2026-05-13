import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileText,
  Upload,
  Palette,
  PenTool,
  Users,
  BarChart3,
  Mail,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Receipt,
  Zap,
  Shield,
  Star,
  Moon,
  Sun,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { AppLogo } from '@/components/AppLogo';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease as unknown as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease as unknown as [number, number, number, number] } },
};

export default function Landing() {
  const { user } = useAuth();
  const { settings, toggleTheme } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-md overflow-hidden">
              <AppLogo className="w-7 h-7" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Invoice<span className="text-primary">Pro</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg"
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section — Refined */}
      <section className="relative overflow-hidden">
        {/* Single soft background gradient — low opacity, no overlap */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.04]" />
        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-8 py-24 sm:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — Text */}
            <motion.div
              className="space-y-10 relative z-10"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp}>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
                  <Zap className="w-3 h-3" /> One-Time Payment — No Subscription
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="text-[2.75rem] sm:text-[3.25rem] lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.1] text-foreground"
              >
                Create Professional Invoices in Minutes —{' '}
                <span className="text-gradient">Using Your Own Template.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-lg sm:text-xl text-muted-foreground max-w-[520px] leading-relaxed"
              >
                Upload your invoice design or use premium templates. Generate polished invoices, send them instantly, and track payments — all in one place.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 pt-2">
                <Button size="lg" asChild className="text-base px-8 h-13 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <Link to="/auth">
                    Start Creating Invoices <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-8 h-13 rounded-xl">
                  <a href="#how-it-works">View Demo</a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Right — Mock Invoice */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-primary/[0.08] blur-3xl" />
                <Card className="relative rounded-2xl shadow-xl border-border/50 overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="w-10 h-10 rounded-lg gradient-primary mb-2" />
                        <p className="text-sm font-bold">Your Company</p>
                        <p className="text-xs text-muted-foreground">hello@company.com</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-primary">INVOICE</p>
                        <p className="text-xs text-muted-foreground">INV-0042</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bill To</p>
                          <p className="text-sm font-medium">Acme Corporation</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                          <p className="text-sm font-medium">Mar 15, 2026</p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 p-2 bg-muted text-xs font-semibold">
                        <span className="col-span-2">Item</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Amount</span>
                      </div>
                      {[
                        { name: 'Web Design', qty: 1, amount: '$2,500' },
                        { name: 'Development', qty: 40, amount: '$6,000' },
                        { name: 'Hosting Setup', qty: 1, amount: '$500' },
                      ].map((item, i) => (
                        <div key={i} className={`grid grid-cols-4 gap-2 p-2 text-xs ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                          <span className="col-span-2">{item.name}</span>
                          <span className="text-right">{item.qty}</span>
                          <span className="text-right font-medium">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <div className="space-y-1 text-right text-sm">
                        <div className="flex justify-between gap-8">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>$9,000.00</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-muted-foreground">Tax (10%)</span>
                          <span>$900.00</span>
                        </div>
                        <div className="flex justify-between gap-8 border-t border-border pt-1 font-bold text-base">
                          <span>Total</span>
                          <span className="text-primary">$9,900.00</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <motion.section
        className="border-y border-border bg-muted/30"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={fadeUp}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: FileText, label: 'Unlimited Invoices' },
              { icon: Palette, label: 'Custom Templates' },
              { icon: Mail, label: 'PDF + Email Delivery' },
              { icon: Shield, label: 'One-Time Payment' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center justify-center gap-2">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Badge variant="secondary" className="px-3 py-1">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything You Need to Invoice Like a Pro
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From custom templates to automated delivery — InvoicePro handles it all.
            </p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {[
              { icon: Upload, title: 'Upload Your Own Invoice Design', desc: 'Drag & map fields onto your own PDF template for fully customized invoices.' },
              { icon: Palette, title: 'Built-In Premium Templates', desc: 'Choose from modern, clean layouts designed for professional businesses.' },
              { icon: PenTool, title: 'Logo & Signature Support', desc: 'Add professional branding with your logo and signature on every invoice.' },
              { icon: Users, title: 'Client & Business Management', desc: 'Save clients and reuse details instantly for faster invoicing.' },
              { icon: BarChart3, title: 'Smart Dashboard', desc: 'Track revenue, outstanding payments, and overdue invoices at a glance.' },
              { icon: Mail, title: 'Email & PDF Export', desc: 'Send invoices with PDF attachment in one click — no extra tools needed.' },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={scaleIn}>
                <Card className="group rounded-2xl border-border/50 shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Badge variant="secondary" className="px-3 py-1">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Three Steps to Professional Invoices
            </h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            {[
              { step: '1', title: 'Add Your Business & Clients', desc: 'Set up your business profile with logo, signature, and save your client details for reuse.' },
              { step: '2', title: 'Create or Upload Template', desc: 'Use our premium built-in templates or upload your own custom invoice design with field mapping.' },
              { step: '3', title: 'Generate, Preview & Send', desc: 'Create polished PDF invoices, preview them instantly, and email directly to clients.' },
            ].map(({ step, title, desc }) => (
              <motion.div key={step} className="text-center space-y-4" variants={fadeUp}>
                <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center text-2xl font-extrabold text-primary-foreground shadow-lg">
                  {step}
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Badge variant="secondary" className="px-3 py-1">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Simple, One-Time Pricing
            </h2>
            <p className="text-muted-foreground text-lg">No subscriptions. No hidden fees. Pay once, use forever.</p>
          </motion.div>
          <motion.div
            className="max-w-md mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={scaleIn}
          >
            <Card className="relative rounded-2xl shadow-xl border-primary/20 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Premium Invoice Generator</h3>
                    <p className="text-sm text-muted-foreground">Everything included</p>
                  </div>
                  <Badge className="bg-success text-success-foreground gap-1">
                    <Star className="w-3 h-3" /> Early Access
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">$50</span>
                  <span className="text-muted-foreground text-lg">one-time</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Unlimited Invoices',
                    'Custom Template Engine',
                    'Email Integration',
                    'PDF Export',
                    'Dashboard Analytics',
                    'Free Updates',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="w-full h-12 text-base rounded-xl shadow-lg" asChild>
                  <Link to="/auth">Buy Now <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">Secure payment • Instant access</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 bg-muted/30">
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Is this a subscription?", "acceptedAnswer": { "@type": "Answer", "text": "No! InvoicePro is a one-time purchase. Pay $50 once and get lifetime access with free updates." } },
              { "@type": "Question", "name": "Can I upload my own invoice template?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! You can upload any PDF, PNG, or JPG invoice design and use our drag-and-drop editor to map fields onto your template." } },
              { "@type": "Question", "name": "Does it support taxes and discounts?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. You can configure default tax rates, per-item tax rates, and discounts. Everything calculates automatically." } },
              { "@type": "Question", "name": "Is my data stored securely?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. All data is encrypted and stored securely with row-level security policies ensuring only you can access your data." } },
              { "@type": "Question", "name": "Can I edit invoices after creating them?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! You can edit any invoice from the Invoice History page. You can also duplicate invoices to quickly create similar ones." } }
            ]
          })}
        </script>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Badge variant="secondary" className="px-3 py-1">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <motion.div
            className="max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
          >
            <Accordion type="single" collapsible className="space-y-2">
              {[
                { q: 'Is this a subscription?', a: 'No! InvoicePro is a one-time purchase. Pay $50 once and get lifetime access with free updates.' },
                { q: 'Can I upload my own invoice template?', a: 'Yes! You can upload any PDF, PNG, or JPG invoice design and use our drag-and-drop editor to map fields onto your template.' },
                { q: 'Does it support taxes and discounts?', a: 'Absolutely. You can configure default tax rates, per-item tax rates, and discounts. Everything calculates automatically.' },
                { q: 'Is my data stored securely?', a: 'Yes. All data is encrypted and stored securely with row-level security policies ensuring only you can access your data.' },
                { q: 'Can I edit invoices after creating them?', a: 'Yes! You can edit any invoice from the Invoice History page. You can also duplicate invoices to quickly create similar ones.' },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-xl px-4 data-[state=open]:bg-card">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section
        className="py-20 sm:py-28 bg-card border-t border-border"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeUp}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center space-y-8">
          <Sparkles className="w-6 h-6 text-primary mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Start Sending Professional Invoices Today.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Join businesses that trust InvoicePro for clean, branded invoicing.
          </p>
          <Button size="lg" asChild className="text-base px-10 h-12 rounded-xl shadow-lg">
            <Link to="/auth">Get Started Now <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">InvoicePro</span>
              </div>
              <p className="text-sm text-muted-foreground">Professional invoicing made simple.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span></li>
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Contact Us</span></li>
                <li><span className="cursor-pointer hover:text-foreground transition-colors">Documentation</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} InvoicePro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
