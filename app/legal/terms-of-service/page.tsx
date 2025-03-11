import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Biosell",
  description: "Terms of Service for Biosell - Automated response service for businesses",
};

const TermsOfServicePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Terms of Service</h1>
        <p className="text-gray-700 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-3">
            Welcome to Biosell. By accessing or using our services, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our services.
          </p>
          <p className="text-gray-700 mb-3">
            These Terms of Service govern your access to and use of the Biosell website, mobile application, and services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Description of Services</h2>
          <p className="text-gray-700 mb-3">
            Biosell provides automated response services for business users, allowing them to manage and automate replies to
            customer comments and direct messages on social media platforms. Our services include but are not limited to:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Automated response to customer inquiries</li>
            <li>Business account management</li>
            <li>Analytics and reporting</li>
            <li>Integration with social media platforms</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">3. User Accounts</h2>
          <p className="text-gray-700 mb-3">
            To use certain features of our services, you may be required to create an account. You are responsible for:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Providing accurate and complete information when creating your account</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
          </ul>
          <p className="text-gray-700 mb-3">
            We reserve the right to suspend or terminate your account if any information provided is inaccurate, false, or no longer valid.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">4. Subscription and Payment</h2>
          <p className="text-gray-700 mb-3">
            Biosell offers subscription-based services. By subscribing to our services, you agree to:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Pay all fees associated with your subscription plan</li>
            <li>Provide accurate billing information</li>
            <li>Be charged automatically for recurring subscription periods unless you cancel before the next billing cycle</li>
          </ul>
          <p className="text-gray-700 mb-3">
            We reserve the right to change our subscription fees upon reasonable notice. Changes to fees will not apply retroactively.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">5. User Content</h2>
          <p className="text-gray-700 mb-3">
            When using our services, you may provide content such as text, images, and other materials. You retain ownership
            of your content, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and
            display your content for the purpose of operating and improving our services.
          </p>
          <p className="text-gray-700 mb-3">
            You are solely responsible for the content you provide and must ensure it does not violate any third-party rights,
            laws, or regulations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">6. Prohibited Activities</h2>
          <p className="text-gray-700 mb-3">
            When using our services, you agree not to:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Distribute malicious content such as viruses or malware</li>
            <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
            <li>Use our services to send spam or unsolicited messages</li>
            <li>Engage in any activity that disrupts or interferes with our services</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">7. Intellectual Property</h2>
          <p className="text-gray-700 mb-3">
            The Biosell name, logo, software, and all related content are protected by intellectual property laws. 
            You may not use, copy, modify, or distribute our intellectual property without our express written permission.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">8. Limitation of Liability</h2>
          <p className="text-gray-700 mb-3">
            To the maximum extent permitted by law, Biosell and its affiliates shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities,
            resulting from your use or inability to use our services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">9. Disclaimer of Warranties</h2>
          <p className="text-gray-700 mb-3">
            Our services are provided "as is" and "as available" without warranties of any kind, either express or implied,
            including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className="text-gray-700 mb-3">
            We do not guarantee that our services will be uninterrupted, error-free, or that any defects will be corrected.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">10. Termination</h2>
          <p className="text-gray-700 mb-3">
            We reserve the right to suspend or terminate your access to our services, with or without notice, for conduct that
            we determine, in our sole discretion, violates these Terms of Service, our policies, or applicable laws.
          </p>
          <p className="text-gray-700 mb-3">
            You may terminate your account at any time by following the instructions provided in our services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">11. Changes to Terms</h2>
          <p className="text-gray-700 mb-3">
            We may update these Terms of Service from time to time. We will notify you of any material changes by posting the
            new Terms of Service on this page and updating the "Last Updated" date. Your continued use of our services after
            any changes indicates your acceptance of the updated Terms of Service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">12. Governing Law</h2>
          <p className="text-gray-700 mb-3">
            These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which
            our company is registered, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">13. Contact Us</h2>
          <p className="text-gray-700 mb-3">
            If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfServicePage; 