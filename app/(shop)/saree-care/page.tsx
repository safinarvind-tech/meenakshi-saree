import type { Metadata } from "next";
import { ContentPage } from "@/components/shop/ContentPage";

export const metadata: Metadata = { title: "Saree care", description: "How to care for your silk saree so it lasts for generations." };

export default function SareeCarePage() {
  return (
    <ContentPage title={<>Caring for your <em className="text-terra">silk</em></>} intro="A silk saree cared for well can be passed down for generations.">
      <h2>Cleaning</h2>
      <ul>
        <li>Dry clean only for the first few washes. Never machine wash pure silk.</li>
        <li>Remove stains quickly by dabbing gently. Don&apos;t rub, especially on zari.</li>
        <li>Never use bleach or strong detergents.</li>
      </ul>
      <h2>Storage</h2>
      <ul>
        <li>Wrap each saree in a soft cotton or muslin cloth. Avoid plastic covers, as silk needs to breathe.</li>
        <li>Refold every two to three months along different lines to prevent permanent creases.</li>
        <li>Keep away from direct sunlight and damp places. Silica gel sachets help in humid weather.</li>
      </ul>
      <h2>Ironing</h2>
      <ul>
        <li>Iron on low heat from the reverse side, with a cotton cloth between the iron and the saree.</li>
        <li>Never spray water directly on silk; it can leave marks.</li>
      </ul>
      <h2>Zari polishing</h2>
      <p>Over the years, zari may lose its shine. Contact us about our zari polishing service.</p>
    </ContentPage>
  );
}
