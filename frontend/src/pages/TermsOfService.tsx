import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertCircle, Code } from 'lucide-react';

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'terms', title: 'Terms of Use', icon: Shield },
    { id: 'disclaimers', title: 'Disclaimers', icon: AlertCircle },
    { id: 'intellectual', title: 'Intellectual Property', icon: Code },
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
          
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">
            Last updated: December 2024
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
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeSection === section.id
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
                <FileText className="w-6 h-6 mr-3 text-primary" />
                Overview
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to ChronosAI! These Terms of Service govern your use of our web application, 
                  which is a major project developed by Ashutosh Sahoo, a B.Tech Computer Science student, 
                  for educational and demonstration purposes.
                </p>
                
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-primary">Important Notice:</strong> ChronosAI is a non-commercial 
                    educational project. By using this service, you acknowledge that this is a student 
                    major project and not a commercial product.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">What is ChronosAI?</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>A calendar integration web application</li>
                  <li>B.Tech Computer Science major project for academic assessment</li>
                  <li>Developed by Ashutosh Sahoo as part of college curriculum</li>
                  <li>Demonstrates modern web development capabilities</li>
                  <li>Integrates with Google Calendar API for functionality</li>
                  <li>Built as a learning and educational tool</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Acceptance of Terms</h3>
                <p>
                  By accessing or using ChronosAI, you agree to these Terms of Service. 
                  If you do not agree to these terms, please do not use the application.
                </p>
              </div>
            </div>
          )}

          {/* Terms of Use Section */}
          {activeSection === 'terms' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                Terms of Use
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <h3 className="text-lg font-medium text-white mb-3">1. Eligibility</h3>
                <p>
                  You must be at least 13 years old to use this service. If you are under 18, 
                  you should have parental or guardian permission to use this application.
                </p>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">2. Acceptable Use</h3>
                <p>You agree to use ChronosAI for lawful purposes only:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Use the application for its intended educational purpose</li>
                  <li>Respect the privacy and rights of other users</li>
                  <li>Do not attempt to compromise system security</li>
                  <li>Do not use the application for illegal activities</li>
                  <li>Do not spam or harass other users</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">3. Account Responsibilities</h3>
                <p>If you create an account:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>You are responsible for maintaining account security</li>
                  <li>You must provide accurate information</li>
                  <li>You are responsible for all activities under your account</li>
                  <li>You must notify us of unauthorized use</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">4. Service Availability</h3>
                <p>
                  As a student project, we cannot guarantee 100% uptime or availability. 
                  The service may be temporarily unavailable for maintenance, testing, 
                  or due to technical limitations.
                </p>
              </div>
            </div>
          )}

          {/* Disclaimers Section */}
          {activeSection === 'disclaimers' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-primary" />
                Disclaimers & Limitations
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <p className="text-sm">
                    <strong className="text-warning">Educational Project Disclaimer:</strong> 
                    ChronosAI is a student project and should not be relied upon for critical 
                    business or personal scheduling needs.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">No Warranty</h3>
                <p>
                  ChronosAI is provided "as is" without any warranties, express or implied. 
                  We make no guarantees about:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Accuracy of calendar data</li>
                  <li>System reliability or uptime</li>
                  <li>Data security (though we implement reasonable measures)</li>
                  <li>Compatibility with all devices or browsers</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by law, we shall not be liable for any 
                  indirect, incidental, special, or consequential damages resulting from 
                  your use of ChronosAI, including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Data loss or corruption</li>
                  <li>Missed appointments or events</li>
                  <li>System downtime or unavailability</li>
                  <li>Any other damages arising from service use</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Third-Party Services</h3>
                <p>
                  ChronosAI integrates with Google Calendar API. We are not responsible for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Google's service terms or policies</li>
                  <li>Google Calendar API availability or functionality</li>
                  <li>Data handled by Google's services</li>
                  <li>Any issues arising from third-party integrations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Intellectual Property Section */}
          {activeSection === 'intellectual' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Code className="w-6 h-6 mr-3 text-primary" />
                Intellectual Property
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <h3 className="text-lg font-medium text-white mb-3">ChronosAI Ownership</h3>
                <p>
                  The ChronosAI application, including its code, design, and functionality, 
                  is the intellectual property of Ashutosh Sahoo, developed as a B.Tech Computer Science 
                  major project. The project is owned by the student developer and their educational institution.
                </p>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Your Content</h3>
                <p>
                  You retain ownership of your calendar data and personal information. 
                  By using ChronosAI, you grant us limited permission to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Access your calendar data for service functionality</li>
                  <li>Process your data to provide calendar features</li>
                  <li>Store necessary data for service operation</li>
                </ul>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Google Services</h3>
                <p>
                  Google Calendar and related services are owned by Google LLC. 
                  Our use of these services is subject to Google's terms and conditions. 
                  We do not claim any ownership over Google's intellectual property.
                </p>
                
                <h3 className="text-lg font-medium text-white mt-6 mb-3">Educational Use</h3>
                <p>
                  This project may be used for educational purposes, including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Academic assessment and grading</li>
                  <li>Technical demonstrations</li>
                  <li>Portfolio and resume purposes</li>
                  <li>Educational research and study</li>
                  <li>College curriculum requirements</li>
                </ul>
                
                <div className="bg-muted/30 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-white mb-2">Attribution</h4>
                  <p className="text-sm">
                    If you reference or use this project in academic or professional contexts, 
                    please provide appropriate attribution to Ashutosh Sahoo as the developer 
                    and acknowledge its educational nature as a B.Tech Computer Science major project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Terms */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <h3 className="text-lg font-medium text-white mb-4">General Terms</h3>
            <div className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">Modifications</h4>
                <p className="text-sm">
                  We reserve the right to modify these terms at any time. Changes will be 
                  effective immediately upon posting. Your continued use of the service 
                  constitutes acceptance of any modifications.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Termination</h4>
                <p className="text-sm">
                  We may suspend or terminate your access to ChronosAI at any time, 
                  with or without notice, for any reason, including violation of these terms.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Governing Law</h4>
                <p className="text-sm">
                  These terms are governed by the laws of the educational institution's 
                  jurisdiction and applicable local laws.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Contact Information</h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Developer:</strong> Ashutosh Sahoo<br />
                    <strong>Project Type:</strong> B.Tech Computer Science Major Project<br />
                    <strong>Purpose:</strong> Educational Demonstration<br />
                    <strong>Email:</strong> sahoashutosh2022@gmail.com<br />
                    <strong>GitHub:</strong> https://github.com/johan-droid<br />
                    <strong>LinkedIn:</strong> https://www.linkedin.com/in/ashutosh-sahoo-064064280
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
