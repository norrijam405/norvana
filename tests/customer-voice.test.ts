import test from "node:test";
import assert from "node:assert/strict";
import {
  containsProduct,
  productQuantityFromOrder,
  purchaseQuantityBand,
  reviewVisibilityDecision,
  validateReviewSubmission,
} from "../src/lib/customer-voice/policy.ts";

test("valid negative and positive reviews follow the same publication path", () => {
  assert.deepEqual(reviewVisibilityDecision(), { moderationState: "PUBLISHED" });

  for (const rating of [1, 5]) {
    const result = validateReviewSubmission({
      productId: 10,
      author: "Buyer",
      rating,
      title: rating === 1 ? "Did not work for us" : "Worked well",
      body: "A specific customer experience.",
      buyerType: "BUSINESS",
      businessName: "Example LLC",
    });
    assert.equal(result.ok, true);
  }
});

test("business reviews require a business name", () => {
  const result = validateReviewSubmission({
    productId: 10,
    author: "Buyer",
    rating: 3,
    title: "Mixed result",
    body: "A specific customer experience.",
    buyerType: "BUSINESS",
  });
  assert.equal(result.ok, false);
});

test("purchase verification inputs must be supplied as a pair", () => {
  const result = validateReviewSubmission({
    productId: 10,
    author: "Buyer",
    rating: 4,
    title: "Good",
    body: "A specific customer experience.",
    orderNumber: "NV-123",
  });
  assert.equal(result.ok, false);
});

test("order item membership is product specific", () => {
  assert.equal(
    containsProduct([{ productId: 4 }, { productId: 9 }], 9),
    true
  );
  assert.equal(containsProduct([{ productId: 4 }], 9), false);
});

test("ratings outside 1 through 5 fail closed", () => {
  for (const rating of [0, 6, 2.5]) {
    const result = validateReviewSubmission({
      productId: 10,
      author: "Buyer",
      rating,
      title: "Review",
      body: "A specific customer experience.",
    });
    assert.equal(result.ok, false);
  }
});


test("optional fulfillment and buying-experience ratings are separately validated", () => {
  const good = validateReviewSubmission({
    productId: 10,
    author: "Buyer",
    rating: 5,
    fulfillmentRating: 2,
    purchaseExperienceRating: 4,
    title: "Product was strong, delivery was not",
    body: "The product itself worked well but fulfillment was late.",
  });
  assert.equal(good.ok, true);

  const bad = validateReviewSubmission({
    productId: 10,
    author: "Buyer",
    rating: 5,
    fulfillmentRating: 6,
    title: "Invalid fulfillment dimension",
    body: "This should fail structural validation.",
  });
  assert.equal(bad.ok, false);
});

test("purchase quantity bands do not expose exact large order quantities", () => {
  const items = [
    { productId: 10, quantity: 3 },
    { productId: 10, quantity: 8 },
    { productId: 11, quantity: 99 },
  ];
  assert.equal(productQuantityFromOrder(items, 10), 11);
  assert.equal(purchaseQuantityBand(1), "1 unit");
  assert.equal(purchaseQuantityBand(3), "2–9 units");
  assert.equal(purchaseQuantityBand(11), "10–49 units");
  assert.equal(purchaseQuantityBand(75), "50+ units");
});
