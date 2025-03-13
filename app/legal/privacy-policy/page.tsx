import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Biosell",
  description: "Privacy Policy for Biosell - Automated response service for businesses",
};

const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
        <p className="text-gray-700 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Introduction</h2>
          <p className="text-gray-700 mb-3">
            Welcome to Biosell. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
          </p>
          <p className="text-gray-700 mb-3">
            Please read this Privacy Policy carefully. By accessing or using Biosell, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this Privacy Policy.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Information We Collect</h2>
          <h3 className="text-lg font-medium mb-2 text-gray-800">2.1 Personal Information</h3>
          <p className="text-gray-700 mb-3">
            We may collect personally identifiable information, such as:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Business information</li>
            <li>Payment information</li>
            <li>Social media account information (when you connect your account)</li>
          </ul>

          <h3 className="text-lg font-medium mb-2 text-gray-800">2.2 Non-Personal Information</h3>
          <p className="text-gray-700 mb-3">
            We may also collect non-personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Device information (device type, operating system, browser type)</li>
            <li>Usage data (interactions with the app, time spent, features used)</li>
            <li>IP address</li>
            <li>Cookies and similar technologies</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send transaction notifications</li>
            <li>Send administrative information, such as updates, security alerts, and support messages</li>
            <li>Respond to customer service requests and other inquiries</li>
            <li>Monitor usage patterns and analyze trends</li>
            <li>Personalize user experience</li>
            <li>Provide automated response services for your business accounts</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">4. Disclosure of Your Information</h2>
          <p className="text-gray-700 mb-3">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Service providers and third-party vendors who perform services on our behalf</li>
            <li>Business partners with whom we jointly offer products or services</li>
            <li>Legal authorities when required by law or to protect our rights</li>
            <li>In connection with a business transaction, such as a merger, acquisition, or asset sale</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">5. Data Security</h2>
          <p className="text-gray-700 mb-3">
            We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">6. Your Data Rights</h2>
          <p className="text-gray-700 mb-3">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>The right to access your personal information</li>
            <li>The right to correct inaccurate or incomplete information</li>
            <li>The right to delete your personal information</li>
            <li>The right to restrict or object to processing</li>
            <li>The right to data portability</li>
          </ul>
          <p className="text-gray-700 mb-3">
            To exercise these rights, please contact us using the information provided in the &quot;Contact Us&quot; section.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">7. Children&apos;s Privacy</h2>
          <p className="text-gray-700 mb-3">
            Our services are not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">8. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-3">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">9. Contact Us</h2>
          <p className="text-gray-700 mb-3">
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700 mb-3">
            Email: <a href="mailto:the.only.apada@gmail.com" className="text-indigo-600 hover:text-indigo-800">the.only.apada@gmail.com</a><br />
            Website: <a href="https://biosell.me" className="text-indigo-600 hover:text-indigo-800">https://biosell.me</a>
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 