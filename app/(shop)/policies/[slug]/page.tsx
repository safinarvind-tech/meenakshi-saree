import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentPage, ToConfirm } from "@/components/shop/ContentPage";

// Draft policy text. Highlighted parts must be confirmed by the client before launch.
// Razorpay requires Shipping, Refund, Privacy and Terms pages before it activates the account.
const POLICIES = {
  shipping: {
    title: "Shipping policy",
    body: (
      <>
        <h2>Delivery within India</h2>
        <ul>
          <li>Free insured shipping on orders above ₹5,000. A flat ₹150 fee applies below that.</li>
          <li>Orders are dispatched within <ToConfirm>2 business days</ToConfirm>. Stitched blouses take <ToConfirm>7–10 extra days</ToConfirm>.</li>
          <li>Delivery usually takes <ToConfirm>3–7 business days</ToConfirm> depending on your location.</li>
          <li>You&apos;ll receive tracking details on WhatsApp and email once your order ships.</li>
        </ul>
        <h2>Cash on Delivery</h2>
        <p>COD is available on orders up to <ToConfirm>₹50,000</ToConfirm>. We call to confirm every COD order before dispatch.</p>
        <h2>International shipping</h2>
        <p><ToConfirm>Currently we ship within India only.</ToConfirm></p>
      </>
    ),
  },
  returns: {
    title: "Returns & exchanges",
    body: (
      <>
        <h2>Exchanges</h2>
        <p>
          You can request an exchange within <ToConfirm>7 days</ToConfirm> of delivery if the saree is unused, unwashed and has all tags and the
          Silk Mark label intact.
        </p>
        <h2>Not eligible</h2>
        <ul>
          <li>Sarees with a stitched blouse, fall & pico done, or other customisation.</li>
          <li>Sarees bought on clearance sale.</li>
        </ul>
        <h2>Damaged or wrong item</h2>
        <p>Please share an unboxing video within 48 hours of delivery and we&apos;ll arrange a free pickup and replacement or full refund.</p>
        <h2>Refunds</h2>
        <p>Approved refunds are made to the original payment method within <ToConfirm>5–7 business days</ToConfirm> of receiving the return.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>We respect your privacy and handle your personal data in line with India&apos;s Digital Personal Data Protection Act, 2023.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, mobile number, email and delivery address, to process and deliver orders.</li>
          <li>Payment details are handled by Razorpay. We never see or store your card or UPI details.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To fulfil orders, send order updates, and provide customer support.</li>
          <li>To send offers only if you subscribe. You can unsubscribe at any time.</li>
        </ul>
        <h2>Sharing</h2>
        <p>We share your details only with our delivery and payment partners, as needed to complete your order. We never sell your data.</p>
        <h2>Contact</h2>
        <p>For any privacy request, including deleting your data, contact <ToConfirm>care@your-domain.in</ToConfirm>.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    body: (
      <>
        <p>By using this website and placing an order, you agree to these terms.</p>
        <h2>Products</h2>
        <p>Handwoven sarees may have slight variations in colour and weave. These are a mark of handcraft, not a defect. Colours may look slightly different on different screens.</p>
        <h2>Pricing</h2>
        <p>All prices are in Indian Rupees and include GST. We reserve the right to correct pricing errors and cancel affected orders with a full refund.</p>
        <h2>Orders</h2>
        <p>An order is confirmed once payment is received, or once a Cash on Delivery order is confirmed by phone.</p>
        <h2>Business details</h2>
        <p>
          <ToConfirm>Sri Meenakshi Silk House, registered address, GSTIN</ToConfirm>
        </p>
      </>
    ),
  },
} as const;

type Slug = keyof typeof POLICIES;

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: POLICIES[slug as Slug]?.title ?? "Policy" };
}

export default function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-12 h-96 max-w-3xl animate-pulse rounded-[var(--radius-panel)] bg-white" />}>
      <Policy params={params} />
    </Suspense>
  );
}

async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug as Slug];
  if (!policy) notFound();
  return <ContentPage title={policy.title}>{policy.body}</ContentPage>;
}
