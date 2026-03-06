import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Sparkles, Zap, Star, ArrowRight, Check, Globe, Shield, Rocket, Users, Clock, TrendingUp } from 'lucide-react';
import Button from '../components/Button';
import AnimatedLogo from '../components/AnimatedLogo';

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI-Powered Intelligence',
      description: 'Natural language processing understands your scheduling needs instantly',
      gradient: 'from-primary to-accent'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Schedule meetings in seconds with our optimized algorithms',
      gradient: 'from-secondary to-primary'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption with OAuth 2.0 and PKCE flow',
      gradient: 'from-accent to-secondary'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Multi-Platform',
      description: 'Seamlessly integrates with Google Calendar and Outlook',
      gradient: 'from-primary via-accent to-secondary'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Smart Conflict Resolution',
      description: 'Automatically finds the best time slots for all attendees',
      gradient: 'from-secondary to-accent'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Real-Time Sync',
      description: 'Instant updates across all your connected calendars',
      gradient: 'from-accent to-primary'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: <Users className="h-5 w-5" /> },
    { value: '50K+', label: 'Meetings Scheduled', icon: <Calendar className="h-5 w-5" /> },
    { value: '99.9%', label: 'Uptime', icon: <TrendingUp className="h-5 w-5" /> },
    { value: '<1s', label: 'Response Time', icon: <Zap className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Galaxy Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Shooting stars */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-20 bg-gradient-to-b from-white to-transparent opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: 'rotate(45deg)',
              animation: `shooting-star ${3 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 border-b border-primary/20 bg-card/30 backdrop-blur-xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <AnimatedLogo className="h-8 w-8" />
              <span className="text-2xl font-bold gradient-text font-['Orbitron']">ChronosAI</span>
            </div>
            <Button variant="cosmic" size="sm" onClick={() => navigate('/login')}>
              Get Started <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className={`text-center space-y-8 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-sm">
            <Rocket className="h-4 w-4 text-accent animate-pulse" />
            <span className="font-['Space_Mono']">Powered by Google Gemini</span>
            <Star className="h-4 w-4 text-primary animate-pulse" />
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold font-['Orbitron'] leading-tight">
            <span className="gradient-text">Schedule Smarter</span>
            <br />
            <span className="text-foreground">Not Harder</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-['Space_Mono']">
            AI-powered meeting scheduler that understands natural language. 
            Connect your calendar and let ChronosAI handle the rest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button variant="cosmic" size="lg" onClick={() => navigate('/login')} className="min-w-[200px]">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              <Calendar className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass rounded-xl p-6 border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:scale-105 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center mb-2 text-primary group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold gradient-text font-['Orbitron']">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-['Space_Mono'] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className={`text-center mb-16 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold gradient-text font-['Orbitron'] mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground font-['Space_Mono']">
            Everything you need to manage meetings effortlessly
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl p-8 glass border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] slide-in-up`}
              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              {/* Icon */}
              <div className="relative mb-4">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} blur-xl opacity-50 group-hover:opacity-75 transition-opacity`} />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-card/50 to-card backdrop-blur-sm inline-block">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground font-['Orbitron'] mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-['Space_Mono'] text-sm">
                {feature.description}
              </p>

              {/* Bottom indicator */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="relative overflow-hidden rounded-3xl glass border border-primary/30 p-12 md:p-20 text-center">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 animate-pulse" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold gradient-text font-['Orbitron']">
              Ready to Transform Your Scheduling?
            </h2>
            <p className="text-xl text-muted-foreground font-['Space_Mono'] max-w-2xl mx-auto">
              Join thousands of professionals who save hours every week with ChronosAI
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button variant="cosmic" size="lg" onClick={() => navigate('/login')} className="min-w-[250px]">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Started for Free
              </Button>
            </div>
            
            {/* Features list */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/20 bg-card/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <AnimatedLogo className="h-6 w-6" />
              <span className="text-lg font-bold gradient-text font-['Orbitron']">ChronosAI</span>
            </div>
            <p className="text-sm text-muted-foreground font-['Space_Mono']">
              © 2024 ChronosAI. Built with ❤️ using modern web technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
