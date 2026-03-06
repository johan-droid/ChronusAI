import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Users, 
  Clock, 
  Shield, 
  CheckCircle,
  Star,
  MessageSquare,
  BarChart3,
  Globe,
  Smartphone,
  Brain
} from 'lucide-react';

export default function LandingPage() {
  const [isAnimated, setIsAnimated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100);
  }, []);

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Intelligence",
      description: "Natural language processing understands your scheduling needs instantly"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Schedule meetings in seconds, not minutes. AI handles all the complexity"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multi-Calendar Sync",
      description: "Seamlessly integrates with Google Calendar and Microsoft Outlook"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Smart Conflict Resolution",
      description: "Automatically finds the best available time slots for all participants"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "SOC 2 compliant with end-to-end encryption and OAuth 2.0"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Timezone Support",
      description: "Handles multiple timezones automatically for international teams"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Operations",
      company: "TechCorp",
      content: "ChronosAI reduced our meeting scheduling time by 90%. It's like having a personal assistant for every team member.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Project Manager",
      company: "InnovateLab",
      content: "The natural language processing is incredible. I just say 'schedule a team sync next Tuesday' and it's done.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "CEO",
      company: "StartupXYZ",
      content: "Finally, a scheduling tool that actually understands context. Game-changer for our distributed team.",
      rating: 5
    }
  ];

  const stats = [
    { value: "10,000+", label: "Meetings Scheduled" },
    { value: "500+", label: "Enterprise Users" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "90%", label: "Time Saved" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Galaxy Background */}
      <div className="stars" />
      <div className="space-particles" />
      <div className="planet planet-1" />
      <div className="planet planet-2" />

      {/* Navigation */}
      <nav className="relative z-10 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
                <Calendar className="h-8 w-8 text-primary relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">ChronosAI</h1>
                <p className="text-xs text-muted-foreground">Enterprise AI Scheduler</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="glass-card px-6 py-2 rounded-lg text-sm font-medium text-foreground hover:border-primary/30 transition-all duration-300 group"
            >
              <span className="flex items-center space-x-2">
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center space-y-8 transition-all duration-1000 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 glass-card px-4 py-2 rounded-full text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-foreground">Powered by Advanced AI</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
                Schedule meetings with
                <span className="gradient-text block">natural language</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your calendar management with AI-powered scheduling. Simply tell ChronosAI what you need in plain English, and watch it handle complex scheduling automatically.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden glass-card px-8 py-4 rounded-xl border border-primary/30 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2 text-foreground font-medium">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="glass-card px-8 py-4 rounded-xl text-foreground font-medium hover:border-white/20 transition-all duration-300">
                Watch Demo
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

      {/* Features Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Powerful features for
              <span className="gradient-text block">modern teams</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to streamline your meeting scheduling process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl hover:border-primary/20 transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              Trusted by
              <span className="gradient-text"> industry leaders</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers are saying about ChronosAI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-2xl space-y-6"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-foreground leading-relaxed">"{testimonial.content}"</p>
                
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
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
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Ready to transform your
                <span className="gradient-text block">scheduling workflow?</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of teams already using ChronosAI to save time and eliminate scheduling conflicts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden glass-card px-8 py-4 rounded-xl border border-primary/30 hover:border-primary/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center space-x-2 text-foreground font-medium">
                  <span>Start Free Trial</span>
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 glass">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-semibold gradient-text">ChronosAI</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>© 2024 ChronosAI. All rights reserved.</span>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}