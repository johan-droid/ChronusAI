import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import ColorBends from '../components/ColorBends';
import AnimatedLogo from '../components/AnimatedLogo';
import {
  ArrowRight,
  Zap,
  Users,
  CheckCircle,
  Video,
  Phone,
  Calendar,
  MousePointer2,
  ExternalLink,
  MessageSquare,
  LayoutGrid,
  Shield,
  Globe,
  Mail,
  Github
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const howItWorks = [
    {
      step: "01",
      title: "Connect your calendar",
      description: "We'll handle all the cross-referencing, so you don't have to worry about double bookings.",
      illustration: (
        <div className="relative h-40 w-full flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse-slow" />
          <div className="relative z-10 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl glass-card flex items-center justify-center border-primary/20 bg-primary/10">
              <span className="text-primary font-bold text-sm">ChronosAI</span>
            </div>
            <div className="absolute -top-4 -right-4 h-12 w-12 rounded-xl glass-card flex items-center justify-center border-white/10 animate-float" style={{ animationDelay: '0s' }}>
              <Calendar className="h-6 w-6 text-orange-400" />
            </div>
            <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-xl glass-card flex items-center justify-center border-white/10 animate-float" style={{ animationDelay: '2s' }}>
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="absolute top-1/2 -right-12 h-10 w-10 rounded-xl glass-card flex items-center justify-center border-white/10 animate-float" style={{ animationDelay: '1s' }}>
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      )
    },
    {
      step: "02",
      title: "Set your availability",
      description: "Want to block off weekends? Set up any buffers? We make that easy.",
      illustration: (
        <div className="relative h-40 w-full p-4">
          <div className="glass-card rounded-xl p-3 border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase">Mon - Fri</span>
              <div className="h-4 w-8 rounded-full bg-primary/20 relative">
                <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
              </div>
            </div>
            <div className="h-8 w-full rounded bg-white/5 border border-white/5 flex items-center justify-between px-2">
              <span className="text-[10px]">9:00 AM</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-[10px]">5:00 PM</span>
            </div>
            <div className="h-8 w-full rounded bg-white/5 border border-white/5 flex items-center justify-between px-2">
              <span className="text-[10px]">10:00 AM</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-[10px]">6:30 PM</span>
            </div>
          </div>
        </div>
      )
    },
    {
      step: "03",
      title: "Choose how to meet",
      description: "It could be a video chat, phone call, or a walk in the park!",
      illustration: (
        <div className="relative h-40 w-full flex items-end justify-center gap-2 p-4">
          <div className="flex-1 glass-card rounded-t-xl h-2/3 border-b-0 flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-400/20 flex items-center justify-center">
              <Video className="h-4 w-4 text-orange-400" />
            </div>
            <span className="text-[10px]">Video</span>
          </div>
          <div className="flex-1 glass-card rounded-t-xl h-full border-b-0 flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Remote</span>
          </div>
          <div className="flex-1 glass-card rounded-t-xl h-2/3 border-b-0 flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-400/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-[10px]">In Person</span>
          </div>
        </div>
      )
    }
  ];

  const wallOfLove = [
    {
      name: "Ant Wilson",
      handle: "@AntWilson",
      content: "(finally) made the move to @chronosai after I couldn't find how to edit events in the calendly dashboard and I must say - dash is 10/10. Bravo @peer_rich and team (I should have moved over years ago!) OSS fam",
      avatar: "AW"
    },
    {
      name: "David Guyon",
      handle: "@DavidGuyon",
      content: "Testing out ChronosAI as an alternative to Calendly and loving it so far. Configurable, good onboarding, simple to use 👍.",
      avatar: "DG"
    },
    {
      name: "David Asabina",
      handle: "@vid",
      content: "Was logged out of my ChronosAI account and Peer (CEO, co-founder) tended to the matter within an hour. It doesn't get much better than this. For a OSS product to be this focus on customer service is next level.",
      avatar: "DA"
    },
    {
      name: "Jack Forge",
      username: "@jackforge",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
      content: "Such an amazing product ChronosAI is. And such a vibe. Great alternative to legacy tools.",
    },
    {
      name: "Dax",
      username: "@thdxr",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dax",
      content: "Regarding productivity software that I've been binging lately, I just tried out ChronosAI, and it is an amazing (better) alternative to Calendly in my opinion. This is particularly true for the free tier.",
    },
    {
      name: "Tobi Lutke",
      username: "@tobi",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tobi",
      content: "ChronosAI is the best thing I discovered this year.",
    }
  ];

  const integrations = [
    { icon: <div className="h-10 w-10 bg-[#1283FF] rounded-xl flex items-center justify-center text-white"><Video className="h-6 w-6" /></div>, label: "Zoom" },
    { icon: <div className="h-10 w-10 bg-[#FFD43B] rounded-xl flex items-center justify-center text-[#E37400]"><Users className="h-6 w-6" /></div>, label: "Google" },
    { icon: <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-500 border border-black/5"><Calendar className="h-6 w-6" /></div>, label: "iCal" },
    { icon: <div className="h-10 w-10 bg-[#FF4F00] rounded-xl flex items-center justify-center text-white"><Zap className="h-6 w-6" /></div>, label: "Zapier" },
    { icon: <div className="h-10 w-10 bg-[#4A154B] rounded-xl flex items-center justify-center text-white"><MessageSquare className="h-6 w-6" /></div>, label: "Slack" },
    { icon: <div className="h-10 w-10 bg-[#F37321] rounded-xl flex items-center justify-center text-white"><ArrowRight className="h-6 w-6" /></div>, label: "Hubspot" },
    { icon: <div className="h-10 w-10 bg-[#00A1E0] rounded-xl flex items-center justify-center text-white"><Shield className="h-6 w-6" /></div>, label: "Salesforce" },
    { icon: <div className="h-10 w-10 bg-[#0078D4] rounded-xl flex items-center justify-center text-white"><Globe className="h-6 w-6" /></div>, label: "Outlook" }
  ];

  const stats = [
    { value: "10,000+", label: "Meetings Scheduled" },
    { value: "500+", label: "Enterprise Users" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "90%", label: "Time Saved" }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-foreground relative overflow-hidden font-sans">
      {/* Dynamic ColorBends Background - Full Page Coverage */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ColorBends
          colors={["#4F46E5", "#7C3AED", "#EC4899"]}
          rotation={15}
          speed={0.1}
          scale={1.5}
          frequency={0.3}
          warpStrength={1.5}
          mouseInfluence={2}
          parallax={0.5}
          noise={0.03}
          transparent
          autoRotate={0.02}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/0 via-[#030303]/40 to-[#030303]" />
      </div>

      {/* Legacy Galaxy Elements (Subtle) */}
      <div className="stars opacity-20" />
      <div className="space-particles opacity-20" />
      <div className="planet planet-1 opacity-20" />
      <div className="planet planet-2 opacity-20" />

      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${isScrolled ? 'pt-2' : 'pt-6'}`}>
        <nav className={`max-w-5xl mx-auto transition-all duration-500 rounded-full border border-white/5 shadow-2xl ${isScrolled ? 'bg-black/60 backdrop-blur-xl border-white/10 px-6 py-2' : 'bg-transparent px-2 py-2 border-transparent'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <AnimatedLogo className={isScrolled ? "h-8 w-8" : "h-10 w-10"} />
              <span className="text-xl font-bold gradient-text">ChronosAI</span>
            </div>

            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
              <button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors cursor-pointer">Features</button>
              <button onClick={() => scrollToSection('workflow')} className="hover:text-primary transition-colors cursor-pointer">Workflow</button>
              <button onClick={() => scrollToSection('testimonials')} className="hover:text-primary transition-colors cursor-pointer">Wall of Love</button>
            </div>

            <button
              onClick={() => navigate('/login')}
              className={`transition-all duration-500 px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 group ${isScrolled ? 'bg-primary text-white hover:bg-primary/90' : 'glass-card border-white/10 hover:border-primary/50 text-foreground'}`}
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center space-x-2 premium-glass px-4 py-2 rounded-full text-sm"
              >
                <div className="h-4 w-4 text-primary rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-foreground/80 font-medium">Powered by Advanced AI</span>
              </motion.div>

              <h1 className="text-5xl lg:text-8xl font-bold text-foreground tracking-tight leading-[1.12] font-heading">
                Schedule meetings with
                <span className="gradient-text pb-1 block">natural language</span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              >
                Transform your calendar management with ChronosAI's AI-powered scheduling. Simply tell ChronosAI what you need in plain English, and watch it handle complex scheduling automatically.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden premium-glass px-8 py-4 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-lg shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2 text-foreground font-semibold">
                  <span>Get Started for Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-16"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-3xl lg:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground/60 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 mb-20"
          >
            <div className="inline-flex items-center space-x-2 premium-glass px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest text-primary/80">
              <MousePointer2 className="h-3.5 w-3.5" />
              <span>How it works</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground font-heading max-w-4xl mx-auto leading-[1.1]">
              With us, appointment scheduling is
              <span className="gradient-text block">actually easy</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="premium-glass rounded-3xl flex flex-col overflow-hidden group border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-2xl shadow-black/40"
              >
                <div className="p-8 space-y-4">
                  <div className="text-xs font-bold text-primary/60 bg-primary/5 w-fit px-3 py-1.5 rounded-full border border-primary/10 tracking-widest uppercase">
                    Step {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground font-heading">{item.title}</h3>
                  <p className="text-muted-foreground/80 leading-relaxed text-sm font-medium">
                    {item.description}
                  </p>
                </div>
                <div className="mt-auto bg-white/[0.02] border-t border-white/5 overflow-hidden transition-colors group-hover:bg-white/[0.04] p-4">
                  {item.illustration}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Store Section */}
      <section id="workflow" className="relative z-10 py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="glass-card p-12 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full text-xs font-medium bg-white/5 border-white/10 uppercase tracking-widest text-muted-foreground">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>App store</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-foreground font-heading leading-[1.1]">
                All your key tools in-sync
                <span className="block text-muted-foreground/40">with your meetings</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-sans max-w-xl">
                ChronosAI works with all apps already in your flow ensuring everything works perfectly together.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-foreground text-background px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 group"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="glass-card px-8 py-3.5 rounded-xl font-bold border-white/10 hover:bg-white/5 transition-all text-foreground flex items-center gap-2">
                  Explore apps
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative w-full lg:w-auto">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-grid-white/[0.02] mask-gradient-to-b" />

              <div className="grid grid-cols-4 gap-6 relative">
                {integrations.map((app, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="aspect-square premium-glass rounded-2xl flex items-center justify-center border-white/5 bg-white/[0.02] group hover:border-primary/40 transition-all duration-500 shadow-xl shadow-black/50"
                  >
                    <div className="transform group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                      {app.icon}
                    </div>
                  </motion.div>
                ))}

                {/* Visual connectors (plus signs) */}
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 text-white/10 font-thin text-2xl">+</div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-thin text-2xl">+</div>
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 text-white/10 font-thin text-2xl">+</div>
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-thin text-2xl rotate-90">+</div>
                <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-thin text-2xl rotate-90">+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wall of Love Section */}
      <section id="testimonials" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full text-xs font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Wall of love</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground font-heading">
              See why our users love
              <span className="gradient-text"> ChronosAI</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Read the impact we've had from those who matter most - our customers.
            </p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {wallOfLove.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="break-inside-avoid premium-glass p-8 rounded-[2rem] space-y-6 hover:border-primary/30 transition-all duration-300 group shadow-xl shadow-black/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold text-sm ring-1 ring-white/20 group-hover:ring-primary/40 transition-all shadow-inner">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm uppercase tracking-wide">{testimonial.name}</div>
                      <div className="text-xs text-primary/60 font-medium">{testimonial.handle}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed font-medium italic">
                  "{testimonial.content.split('@').map((part, i) =>
                    i === 0 ? part : (
                      <span key={i}>
                        <span className="text-primary font-bold hover:underline cursor-pointer">@{part.split(' ')[0]}</span>
                        {part.substring(part.split(' ')[0].length)}
                      </span>
                    )
                  )}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="premium-glass p-16 rounded-[3rem] space-y-10 border border-white/5 shadow-3xl shadow-primary/5"
          >
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-6xl font-bold text-foreground font-heading tracking-tight">
                Ready to transform your
                <span className="gradient-text-vibrant block">scheduling workflow?</span>
              </h2>
              <p className="text-xl text-muted-foreground/80 font-medium max-w-2xl mx-auto lead-relaxed">
                Join thousands of teams already using ChronosAI to save time and eliminate scheduling conflicts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden bg-primary text-white px-10 py-5 rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Start for Free Now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/60 font-semibold pt-6 border-t border-white/5">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary/60" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary/60" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary/60" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Multi-Column Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-gradient-to-b from-[#030303]/90 via-[#050510]/95 to-[#0a0a1a] backdrop-blur-xl overflow-hidden">

        {/* ===== Space Background Decorations ===== */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {/* Subtle starfield */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.05,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}

          {/* Astronaut floating in space — right side on desktop, bottom-right on mobile */}
          <div className="absolute bottom-16 right-6 md:top-16 md:right-16 lg:right-24 astronaut-float opacity-[0.12] md:opacity-[0.08]">
            <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Helmet */}
              <ellipse cx="60" cy="35" rx="22" ry="24" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.03)" />
              <ellipse cx="60" cy="35" rx="16" ry="18" stroke="rgba(100,180,255,0.4)" strokeWidth="1" fill="rgba(100,180,255,0.05)" />
              {/* Visor reflection */}
              <path d="M50 28 Q55 22, 65 25" stroke="rgba(150,200,255,0.3)" strokeWidth="1" fill="none" />
              {/* Body / Suit */}
              <rect x="42" y="58" width="36" height="35" rx="8" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.03)" />
              {/* Life support backpack */}
              <rect x="36" y="62" width="8" height="20" rx="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(255,255,255,0.02)" />
              {/* Left arm */}
              <path d="M42 65 Q28 70, 22 82" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="20" cy="84" r="4" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.03)" />
              {/* Right arm */}
              <path d="M78 65 Q92 72, 95 58" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="96" cy="56" r="4" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.03)" />
              {/* Left leg */}
              <path d="M50 93 Q46 110, 40 122" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <rect x="35" y="120" width="12" height="6" rx="2" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.03)" />
              {/* Right leg */}
              <path d="M70 93 Q74 108, 80 118" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <rect x="75" y="116" width="12" height="6" rx="2" stroke="white" strokeWidth="1" fill="rgba(255,255,255,0.03)" />
              {/* Tether line */}
              <path d="M36 72 Q10 50, 5 20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" />
            </svg>
          </div>

          {/* Planet 1 — Saturn-like, top-left */}
          <div className="absolute top-8 left-8 md:top-20 md:left-20 opacity-[0.1]">
            <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
              <circle cx="40" cy="30" r="16" fill="url(#saturn_grad)" />
              <ellipse cx="40" cy="30" rx="35" ry="8" stroke="rgba(210,170,120,0.4)" strokeWidth="1.5" fill="none" transform="rotate(-15 40 30)" />
              <defs>
                <radialGradient id="saturn_grad"><stop offset="0%" stopColor="#E3BB76" /><stop offset="100%" stopColor="#A67C3D" /></radialGradient>
              </defs>
            </svg>
          </div>

          {/* Planet 2 — Blue Earth-like, mid-left */}
          <div className="hidden md:block absolute top-1/2 left-10 opacity-[0.08]">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
              <circle cx="25" cy="25" r="20" fill="url(#earth_grad)" />
              <path d="M15 18 Q20 15, 28 20 Q32 25, 25 30 Q20 32, 16 28 Z" fill="rgba(100,180,100,0.3)" />
              <defs>
                <radialGradient id="earth_grad"><stop offset="0%" stopColor="#4A90D9" /><stop offset="100%" stopColor="#1B3A6B" /></radialGradient>
              </defs>
            </svg>
          </div>

          {/* Planet 3 — Mars red, bottom-left */}
          <div className="hidden md:block absolute bottom-24 left-1/4 opacity-[0.07]">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="14" fill="url(#mars_grad)" />
              <defs>
                <radialGradient id="mars_grad"><stop offset="0%" stopColor="#E27B58" /><stop offset="100%" stopColor="#8B3A1A" /></radialGradient>
              </defs>
            </svg>
          </div>

          {/* Nebula glow — bottom center */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full bg-primary/5 blur-[80px]" />
        </div>

        {/* ===== Footer Content ===== */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-8 md:pb-12 relative z-10">

          {/* Top row — Brand + Link Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-10 md:mb-16">

            {/* Brand Column — full width on mobile */}
            <div className="col-span-2 space-y-6 mb-4 md:mb-0">
              <div className="flex items-center space-x-3">
                <AnimatedLogo className="h-9 w-9" />
                <span className="text-xl font-bold gradient-text">ChronosAI</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xs">
                The next generation of AI-powered scheduling. Plan, sync, and meet without the friction.
              </p>
              {/* Social Icons Row */}
              <div className="flex items-center gap-3">
                <a href="mailto:sahooashutosh2022@gmail.com" className="group h-10 w-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 flex items-center justify-center hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300" title="Email">
                  <Mail className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a href="https://github.com/johan-droid" target="_blank" rel="noopener noreferrer" className="group h-10 w-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 flex items-center justify-center hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300" title="GitHub">
                  <Github className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a href="https://chronosai.onrender.com" target="_blank" rel="noopener noreferrer" className="group h-10 w-10 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 flex items-center justify-center hover:border-primary/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300" title="Live Demo">
                  <ExternalLink className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-[11px]">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Changelog</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-[11px]">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors duration-200">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4 col-span-2 sm:col-span-1">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-[11px]">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors duration-200 text-left">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-primary transition-colors duration-200 text-left">Terms of Service</button></li>
                <li><a href="#" className="hover:text-primary transition-colors duration-200">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-6 mt-2 border-t border-white/[0.06] space-y-4">
            {/* Major Project Badge — centered */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border border-primary/25 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                <span className="text-[11px] uppercase font-extrabold tracking-[0.15em] text-primary">🎓 Major Project</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide">B.Tech Final Year</span>
              </div>
            </div>

            {/* Copyright + Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-1">
              <p className="text-[13px] font-semibold text-foreground/70 text-center sm:text-left">
                © 2026 <span className="font-bold gradient-text">ChronosAI</span> · Made with <span className="text-red-500">❤️</span> for world-class teams
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                <span className="uppercase font-bold tracking-[0.12em] text-[9px] text-muted-foreground">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}