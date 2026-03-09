import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isAnimated, setIsAnimated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100);

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
              <span className="text-primary font-bold text-sm">ChronusAI</span>
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
      content: "(finally) made the move to @chronusai after I couldn't find how to edit events in the calendly dashboard and I must say - dash is 10/10. Bravo @peer_rich and team (I should have moved over years ago!) OSS fam",
      avatar: "AW"
    },
    {
      name: "David Guyon",
      handle: "@DavidGuyon",
      content: "Testing out as an alternative to Calendly and loving it so far. Configurable, good onboarding, simple to use 👍.",
      avatar: "DG"
    },
    {
      name: "David Asabina",
      handle: "@vid",
      content: "Was logged out of my account and Peer (CEO, co-founder) tended to the matter within an hour. It doesn't get much better than this. For a OSS product to be this focus on customer service is next level.",
      avatar: "DA"
    },
    {
      name: "Aarón García",
      handle: "@aarongarciah",
      content: "Such an amazing product @chronusai is. And such a vibe. Great alternative to legacy tools.",
      avatar: "AG"
    },
    {
      name: "Andrew S. Rosen",
      handle: "@Andrew_S_Rosen",
      content: "Regarding productivity software that I've been binging lately, I just tried out @chronusai, and it is an amazing (better) alternative to Calendly in my opinion. This is particularly true for the free tier.",
      avatar: "AR"
    },
    {
      name: "Tosin 🔔",
      handle: "@heisguyy",
      content: "@chronusai is the best thing I discovered this year.",
      avatar: "T"
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
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={0}
          speed={0.15}
          scale={1.2}
          frequency={0.4}
          warpStrength={1.2}
          mouseInfluence={1.5}
          parallax={0.8}
          noise={0.05}
          transparent
          autoRotate={0.05}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/50 to-[#030303]" />
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
              <span className="text-xl font-bold gradient-text">ChronusAI</span>
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
          <div className={`text-center space-y-8 transition-all duration-1000 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} `}>
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full text-sm">
                <div className="h-4 w-4 text-primary rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-foreground">Powered by Advanced AI</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight font-heading">
                Schedule meetings with
                <span className="gradient-text block">natural language</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your calendar management with AI-powered scheduling. Simply tell ChronusAI what you need in plain English, and watch it handle complex scheduling automatically.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden glass-card px-8 py-4 rounded-xl border border-primary/30 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2 text-foreground font-medium">
                  <span>Sign In Now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-3xl lg:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full text-xs font-medium">
              <MousePointer2 className="h-3.5 w-3.5 text-primary" />
              <span>How it works</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground font-heading max-w-4xl mx-auto leading-[1.1]">
              With us, appointment scheduling is
              <span className="gradient-text block">easy</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Effortless scheduling for business and individuals, powerful solutions for fast-growing modern companies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl flex flex-col overflow-hidden group hover:border-primary/20 transition-all duration-500"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="p-8 space-y-4">
                  <div className="text-xs font-bold text-muted-foreground/50 bg-white/5 w-fit px-2 py-1 rounded">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground font-heading">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
                <div className="mt-auto bg-white/[0.02] border-t border-white/5 overflow-hidden transition-colors group-hover:bg-white/[0.04]">
                  {item.illustration}
                </div>
              </div>
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
                ChronusAI works with all apps already in your flow ensuring everything works perfectly together.
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
                  <div
                    key={i}
                    className="aspect-square glass-card rounded-2xl flex items-center justify-center border-white/5 bg-white/[0.02] group hover:border-primary/20 transition-all duration-500"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="transform group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-black/40">
                      {app.icon}
                    </div>
                  </div>
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
              <span className="gradient-text"> ChronusAI</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Read the impact we've had from those who matter most - our customers.
            </p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {wallOfLove.map((testimonial, index) => (
              <div
                key={index}
                className="break-inside-avoid glass-card p-6 rounded-2xl space-y-4 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-xs ring-1 ring-white/10 group-hover:ring-primary/30 transition-all">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.handle}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                  {testimonial.content.split('@').map((part, i) =>
                    i === 0 ? part : (
                      <span key={i}>
                        <span className="text-primary hover:underline cursor-pointer">@{part.split(' ')[0]}</span>
                        {part.substring(part.split(' ')[0].length)}
                      </span>
                    )
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="glass-card p-12 rounded-3xl space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground font-heading">
                Ready to transform your
                <span className="gradient-text block">scheduling workflow?</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of teams already using ChronusAI to save time and eliminate scheduling conflicts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden glass-card px-8 py-4 rounded-xl border border-primary/30 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2 text-foreground font-medium">
                  <span>Get Started Now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Multi-Column Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030303]/80 backdrop-blur-xl overflow-hidden">
        {/* Space Decorations */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden h-full w-full">
          {/* Astronaut */}
          <div className="absolute top-1/4 left-10 md:left-20 opacity-20 astronaut-float">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 2a5 5 0 0 1 5 5v2a1 1 0 0 0 1 1h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a1 1 0 0 0-1 1v2a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5v-2a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a1 1 0 0 0 1-1V7a5 5 0 0 1 5-5z" />
              <path d="M9 13a3 3 0 0 1 6 0" />
            </svg>
          </div>

          {/* Planets */}
          <div className="absolute top-1/2 right-1/4">
            <div className="planet-footer planet-footer-mercury"></div>
            <div className="planet-footer planet-footer-venus"></div>
            <div className="planet-footer planet-footer-earth"></div>
            <div className="planet-footer planet-footer-mars"></div>
            <div className="planet-footer planet-footer-jupiter"></div>
          </div>

          {/* Random floating dots/stars for extra depth */}
          <div className="absolute top-10 right-20 w-1 h-1 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 md:pt-24 pb-8 md:pb-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-12 mb-12 md:mb-20">
            <div className="sm:col-span-2 space-y-8">
              <div className="flex items-center space-x-3">
                <AnimatedLogo className="h-10 w-10" />
                <span className="text-xl font-bold gradient-text">ChronusAI</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                The next generation of AI-powered scheduling. Plan, sync, and meet without the friction.
              </p>
              <div className="flex items-center gap-4">
                <a href="mailto:sahooashutosh2022@gmail.com" className="h-10 w-10 glass-card rounded-xl flex items-center justify-center hover:border-primary/50 transition-all group" title="Email">
                  <Mail className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
                <a href="https://github.com/johan-droid" target="_blank" rel="noopener noreferrer" className="h-10 w-10 glass-card rounded-xl flex items-center justify-center hover:border-primary/50 transition-all group" title="GitHub">
                  <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
                <a href="https://chronusai.onrender.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 glass-card rounded-xl flex items-center justify-center hover:border-primary/50 transition-all group" title="Live Demo">
                  <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Legal</h4>
              <ul className="space-y-3 md:space-y-4 text-sm text-muted-foreground flex flex-col">
                <li className="flex"><button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors text-left py-0.5">Privacy Policy</button></li>
                <li className="flex"><button onClick={() => navigate('/terms-of-service')} className="hover:text-primary transition-colors text-left py-0.5">Terms of Service</button></li>
                <li><a href="#" className="hover:text-primary transition-colors py-0.5">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2026 ChronusAI. Made with ❤️ for world-class teams.</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">System Status: All systems go</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}