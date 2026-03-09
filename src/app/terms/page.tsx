export default function TermsPage() {
  return (
    <div className="min-h-screen bg-amber-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-amber-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-amber-700">Last updated: March 2026</p>

        <div className="mt-8 space-y-6 text-amber-800/90">
          <section>
            <h2 className="font-semibold text-amber-900">1. Service</h2>
            <p>
              Adventures Of provides AI-generated personalized storybooks. You upload photos and
              answer questions; we generate a digital book. The service is provided as-is.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-amber-900">2. Your responsibilities</h2>
            <p>
              You confirm you are the parent or legal guardian of the child whose photos you
              upload. You grant us a license to use the photos and data solely to create your
              book. You will not upload content that infringes others&apos; rights or is harmful.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-amber-900">3. Payment and refunds</h2>
            <p>
              Digital books cost $15. Refunds are available within 7 days of purchase if you are
              not satisfied. See the refund request flow in your order history.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-amber-900">4. Intellectual property</h2>
            <p>
              You receive a personal, non-commercial license to the generated book. We retain
              rights to our platform, templates, and AI models.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-amber-900">5. Limitation of liability</h2>
            <p>
              We are not liable for indirect, incidental, or consequential damages. Our liability
              is limited to the amount you paid for the book.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-amber-900">6. Changes</h2>
            <p>
              We may update these terms. Continued use after changes constitutes acceptance.
            </p>
          </section>
        </div>

        <p className="mt-12">
          <a href="/" className="text-amber-600 hover:underline">
            ← Back
          </a>
        </p>
      </div>
    </div>
  );
}
