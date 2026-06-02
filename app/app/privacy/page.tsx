'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-invert max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Geev ("we," "us," "our," or "Company") operates the platform.
                This page informs you of our policies regarding the collection,
                use, and disclosure of personal data when you use our service
                and the choices you have associated with that data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                1. Information Collection and Use
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We collect several different types of information for various
                purposes:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1.1 Personal Data
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Username and profile information</li>
                <li>Phone number (optional)</li>
                <li>Cookies and usage data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1.2 Usage Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may also collect information about how you interact with our
                service, such as the pages visited, the time and date of the
                visit, the duration of stay, and other usage information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                2. Use of Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Geev uses the collected data for various purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>
                  To allow you to participate in interactive features of our
                  service when you choose to do so
                </li>
                <li>To provide customer support</li>
                <li>
                  To gather analysis or valuable information about how our
                  service is being used
                </li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                3. Security of Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The security of your data is important to us but remember that
                no method of transmission over the Internet or method of
                electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your personal data, we
                cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                4. Wallet and Payment Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you connect a wallet to Geev, we do not store your private
                keys. We only store your wallet address and transaction history
                for platform functionality. All wallet transactions are
                processed through secure third-party providers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                5. Third-Party Services
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our service may contain links to third-party websites and
                services that are not operated by us. This privacy policy does
                not apply to third-party websites and services, and we are not
                responsible for their privacy practices. We encourage you to
                review the privacy policies of any third-party services before
                providing your personal information or using these services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                6. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update our privacy policy from time to time. We will
                notify you of any changes by posting the new privacy policy on
                this page and updating the "Last updated" date at the top of
                this privacy policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                7. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about this privacy policy, please{' '}
                <Link
                  href="/support"
                  className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
                >
                  contact us
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
