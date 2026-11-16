import type { Metadata } from "next";
import { ContentPage } from "@/components/shop/ContentPage";

export const metadata: Metadata = { title: "Our story", description: "Three generations of Kanchipuram silk, since 1972." };

export default function OurStoryPage() {
  return (
    <ContentPage title={<>Our <em className="text-terra">story</em></>} intro="Three generations, one promise: pure silk, honest zari.">
      <p>
        Sri Meenakshi Silk House began in 1972 as a small shop beside the looms of Kanchipuram. Our founder knew every weaver by name, and that
        is still how we work today.
      </p>
      <h2>Direct from the loom</h2>
      <p>
        We buy every saree directly from the weaver families who make it, many of whom have worked with us for decades. There are no middlemen,
        so weavers earn fairly and you pay an honest price.
      </p>
      <h2>Checked by family</h2>
      <p>
        Every pure silk saree is Silk Mark certified and its zari is tested before it leaves us. If it isn&apos;t something we would give our own
        daughters, we don&apos;t sell it.
      </p>
      <h2>Now, closer to you</h2>
      <p>
        This website brings our store to your home. Browse online, book a video call to see a saree live, and we&apos;ll deliver it anywhere in
        India.
      </p>
    </ContentPage>
  );
}
