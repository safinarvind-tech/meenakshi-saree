import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ToConfirm } from "@/components/shop/ContentPage";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  return (
    <ContentPage title={<>Contact <em className="text-terra">us</em></>} intro="We're happy to help you choose, track an order, or answer any question.">
      <h2>Visit our store</h2>
      <p>
        <ToConfirm>Store address, Kanchipuram, Tamil Nadu – PIN</ToConfirm>
        <br />
        Open <ToConfirm>Monday to Saturday, 10am – 8pm</ToConfirm>
      </p>
      <h2>Call or WhatsApp</h2>
      <p>
        <ToConfirm>+91 XXXXX XXXXX</ToConfirm>
      </p>
      <h2>Email</h2>
      <p>
        <ToConfirm>care@your-domain.in</ToConfirm>
      </p>
      <h2>See sarees live</h2>
      <p>
        <Link href="/video-call" className="underline underline-offset-4">
          Book a video call
        </Link>{" "}
        and we&apos;ll show you sarees in natural light.
      </p>
    </ContentPage>
  );
}
