/**
 * Integration test for the order logic against the real database.
 * Creates a temporary product, places orders, checks stock and coupon handling, then cleans up.
 *   npx tsx scripts/test-orders.ts
 */
import "./load-env";
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { cancelOrder, CheckoutError, createOrder, priceCart, type CheckoutInput } from "../lib/orders";

const input: CheckoutInput = {
  name: "Test Customer",
  phone: "9876543210",
  email: "",
  line1: "12 Test Street, Gandhi Nagar",
  line2: "",
  city: "Kanchipuram",
  state: "Tamil Nadu",
  pincode: "631501",
  note: "",
  payment: "COD",
  coupon: "",
};

async function main() {
  const product = await db.product.create({
    data: { sku: `TEST-${Date.now()}`, slug: `test-${Date.now()}`, name: "Test Saree", price: 10000_00, stock: 1, status: "ACTIVE" },
  });
  const coupon = await db.coupon.create({ data: { code: `T${Date.now()}`, type: "PERCENT", value: 10, minOrder: 5000_00, maxUses: 1 } });
  const line = { productId: product.id, blouse: "STITCHED", addOns: ["FALL_PICO"], quantity: 1 };
  const orderIds: string[] = [];
  try {
    // 1. Pricing: ₹10,000 + ₹1,200 stitched blouse + ₹250 fall & pico, 10% coupon, free shipping above ₹5,000
    const q = await priceCart([line], coupon.code);
    assert.equal(q.subtotal, 11450_00);
    assert.equal(q.discount, 1145_00);
    assert.equal(q.shipping, 0);
    assert.equal(q.total, 10305_00);
    console.log("✓ pricing, options and coupon");

    // 2. Two people try to buy the last saree at the same time: exactly one succeeds.
    const results = await Promise.allSettled([
      createOrder({ ...input, coupon: coupon.code }, [line]),
      createOrder({ ...input, phone: "9123456780" }, [line]),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    assert.equal(ok.length, 1, "exactly one order should succeed");
    assert.ok(failed[0].status === "rejected" && failed[0].reason instanceof CheckoutError);
    const order = (ok[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof createOrder>>>).value;
    orderIds.push(order.id);
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock, 0);
    console.log("✓ last saree can only be sold once (concurrent checkout)");

    // 3. Sold out now
    await assert.rejects(createOrder(input, [line]), CheckoutError);
    console.log("✓ sold-out saree is rejected");

    // 4. Cancelling restores stock (and is safe to repeat)
    await cancelOrder(order.id, "test");
    await cancelOrder(order.id, "test again");
    assert.equal((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock, 1);
    console.log("✓ cancel restores stock, idempotent");

    // 5. Prices from the browser are ignored: the server uses the database price
    const o2 = await createOrder(input, [line]);
    orderIds.push(o2.id);
    assert.equal(o2.subtotal, 11450_00);
    console.log("✓ order total computed on the server");
  } finally {
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await db.order.deleteMany({ where: { items: { some: { productId: product.id } } } });
    await db.product.delete({ where: { id: product.id } });
    await db.coupon.delete({ where: { id: coupon.id } });
    await db.customer.deleteMany({ where: { phone: { in: ["9876543210", "9123456780"] }, orders: { none: {} } } });
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
