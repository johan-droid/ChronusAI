import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Users } from 'lucide-react';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: Shield },
    { id: 'collection', title: 'Data Collection', icon: Database },
    { id: 'usage', title: 'Data Usage', icon: Eye },
    { id: 'sharing', title: 'Data Sharing', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="galaxy-bg" />
      <div className="stars">
        <div className="star" />
        <div className="star" />
        <div className="star" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: March 8, 2026
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {section.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-8">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                Overview
              </h2>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  ChronosAI is an AI-powered meeting scheduler and calendar management platform that
                  integrates with Google Calendar to provide intelligent scheduling assistance. This Privacy Policy
                  explains how we collect, use, and protect your information when you use our web application.
                </p>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-primary">Important:</strong> We are committed to protecting your privacy
                    and ensuring your data is handled securely and transparently.
                  </p>
                </div>

                <h3 className="text-lg font-medium text-white mt-6 mb-3">Key Principles</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Minimal data collection - only what's necessary for functionality</li>
                  <li>Transparent data usage - you always know what we're doing</li>
                  <li>Secure storage - encrypted data transmission and storage</li>
                  <li>Your control - you can access and delete your data anytime</li>
                  <li>Privacy by design - privacy built into every feature</li>
                </ul>
              </div>
            </div>
          )}

          {/* Data Collection Section */}
          {activeSection === 'collection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Database className="w-6 h-6 mr-3 text-primary" />
                Data Collection
              </h2>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  We collect minimal information necessary to provide the calendar integration service:
                </p>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Authentication Data</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Email address (from Google OAuth)</li>
                      <li>• Name (from Google profile)</li>
                      <li>• OAuth tokens (encrypted for security)</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Calendar Data</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Calendar events (with your permission)</li>
                      <li>• Calendar schedules (for availability checking)</li>
                      <li>• Meeting metadata (titles, times, attendees)</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Technical Data</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Application usage logs (for debugging)</li>
                      <li>• Error reports (to improve the service)</li>
                      <li>• Session information (for security)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Usage Section */}
          {activeSection === 'usage' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Eye className="w-6 h-6 mr-3 text-primary" />
                Data Usage
              </h2>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your data is used exclusively for the following purposes:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-white">Calendar Integration</strong>
                      <p className="text-sm mt-1">Access and display your Google Calendar events</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-white">Availability Checking</strong>
                      <p className="text-sm mt-1">Calculate free/busy slots for scheduling</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-white">User Authentication</strong>
                      <p className="text-sm mt-1">Secure login and session management</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-white">Educational Research</strong>
                      <p className="text-sm mt-1">Demonstrate web development capabilities</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-6">
                  <p className="text-sm">
                    <strong>We never:</strong> Sell your data, use it for advertising,
                    share it with third parties (except Google Calendar API),
                    or analyze it for commercial purposes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Sharing Section */}
          {activeSection === 'sharing' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Users className="w-6 h-6 mr-3 text-primary" />
                Data Sharing
              </h2>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  We are committed to protecting your data and only share it in limited circumstances:
                </p>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Google Calendar API</h4>
                    <p className="text-sm">
                      Your calendar data is shared with Google's servers only when you explicitly
                      grant permission. This is necessary for:
                    </p>
                    <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                      <li>Reading your calendar events</li>
                      <li>Creating new events</li>
                      <li>Updating existing events</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">No Third-Party Sharing</h4>
                    <p className="text-sm">
                      We do not share your data with any other third parties.
                      Your information is never sold, rented, or used for marketing.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">Academic Context</h4>
                    <p className="text-sm">
                      As a student project, your data may be reviewed by instructors
                      for grading purposes, but this is limited to technical implementation
                      and functionality assessment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <h3 className="text-lg font-medium text-white mb-4">Contact & Questions</h3>
            <div className="text-muted-foreground space-y-2">
              <p>
                If you have questions about this Privacy Policy or how we handle your data,
                please contact the developer:
              </p>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Developer:</strong> ChronosAI Team<br />
                  <strong>Project Type:</strong> AI-Powered Scheduling Platform<br />
                  <strong>Purpose:</strong> Intelligent Calendar Management<br />
                  <strong>Email:</strong> hello@chronosai.com<br />
                  <strong>GitHub:</strong> https://github.com/johan-droid/ChronosAI<br />
                  <strong>Website:</strong> https://chronosai.onrender.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
