ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commerce_model varchar(50) NOT NULL DEFAULT 'QUALIFIED_SUPPLIER',
  ADD COLUMN IF NOT EXISTS source_provider_slug varchar(120),
  ADD COLUMN IF NOT EXISTS brand_name varchar(255),
  ADD COLUMN IF NOT EXISTS product_condition varchar(40) NOT NULL DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS authorization_state varchar(60) NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS image_rights_state varchar(60) NOT NULL DEFAULT 'LEGACY_UNVERIFIED',
  ADD COLUMN IF NOT EXISTS external_checkout_url varchar(1500),
  ADD COLUMN IF NOT EXISTS external_seller_name varchar(255),
  ADD COLUMN IF NOT EXISTS affiliate_network varchar(120),
  ADD COLUMN IF NOT EXISTS affiliate_program varchar(255),
  ADD COLUMN IF NOT EXISTS external_product_id varchar(255),
  ADD COLUMN IF NOT EXISTS product_evidence json NOT NULL DEFAULT '{}'::json;

CREATE TABLE IF NOT EXISTS outbound_referral_clicks (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  provider_slug varchar(120) NOT NULL,
  destination_host varchar(255) NOT NULL,
  commerce_model varchar(50) NOT NULL DEFAULT 'AFFILIATE_REFERRAL',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbound_referral_clicks_product_id_idx
  ON outbound_referral_clicks(product_id);

CREATE INDEX IF NOT EXISTS outbound_referral_clicks_created_at_idx
  ON outbound_referral_clicks(created_at);

CREATE TABLE IF NOT EXISTS watch_candidate_snapshots (
  id serial PRIMARY KEY,
  candidate_id integer NOT NULL,
  provider_slug varchar(120),
  source_kind varchar(80) NOT NULL DEFAULT 'WEB',
  identity json NOT NULL DEFAULT '{}'::json,
  pricing json NOT NULL DEFAULT '{}'::json,
  supply json NOT NULL DEFAULT '{}'::json,
  trust json NOT NULL DEFAULT '{}'::json,
  demand json NOT NULL DEFAULT '{}'::json,
  economics json NOT NULL DEFAULT '{}'::json,
  scorecard json NOT NULL DEFAULT '{}'::json,
  risk_flags json NOT NULL DEFAULT '[]'::json,
  evidence_refs json NOT NULL DEFAULT '[]'::json,
  source_digest varchar(128),
  observed_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watch_candidate_snapshots_candidate_id_idx
  ON watch_candidate_snapshots(candidate_id);

CREATE INDEX IF NOT EXISTS watch_candidate_snapshots_provider_slug_idx
  ON watch_candidate_snapshots(provider_slug);

INSERT INTO watch_jobs (
  slug, name, category, description, instructions, authority, status,
  cadence_minutes, budget_cents, notify_on_material_only, source_policy
)
VALUES
(
  'consumer-electronics-devices-watch',
  'Consumer Electronics & Devices Watch',
  'electronics',
  'Find authorized electronics/device opportunities with usable distribution, pricing, stock, freight, warranty, and return evidence.',
  'Research legitimate electronics and device opportunities from brand-direct and authorized-distribution channels. Capture identity, cost, stock, freight, warranty, returns, channel restrictions, safety/recall state, competitor range, and contribution economics. Never auto-order or publish.',
  'RECOMMEND', 'PAUSED', 1440, 0, true,
  '{"preferOfficialSources":true,"requireChannelAuthorization":true,"requireProductIdentity":true,"requireContributionEconomics":true,"noAutoOrder":true,"noAutoPublish":true}'::json
),
(
  'brand-fashion-wholesale-watch',
  'Brand Fashion Wholesale Watch',
  'fashion',
  'Find legitimate brand and wholesale fashion relationships suitable for Acre Era.',
  'Research brand-direct and wholesale fashion opportunities. Capture retailer eligibility, brand approval state, assortment, MOQ, costs, returns, media rights, delivery windows, replenishment, and contribution economics. Never auto-contact, order, or publish.',
  'RECOMMEND', 'PAUSED', 10080, 0, true,
  '{"requireBrandRelationshipEvidence":true,"requireImageRightsEvidence":true,"requireContributionEconomics":true,"noAutoContact":true,"noAutoOrder":true,"noAutoPublish":true}'::json
),
(
  'luxury-authenticity-watch',
  'Luxury & Authenticity Watch',
  'luxury',
  'Qualify luxury sourcing and authentication evidence without weakening provenance standards.',
  'Research luxury wholesale, dropship, authenticated resale, and referral opportunities. Capture provenance, reseller evidence, brand authorization, authentication support, condition, identifiers, packaging, return/fraud reserves, image rights, fulfillment, and economics. Reject counterfeit, stolen, replica, or unverifiable goods.',
  'RECOMMEND', 'PAUSED', 10080, 0, true,
  '{"requireProvenance":true,"requireAuthenticityEvidence":true,"requireImageRightsEvidence":true,"requireFraudReserve":true,"rejectCounterfeitRisk":true,"noAutoOrder":true,"noAutoPublish":true}'::json
),
(
  'affiliate-commerce-watch',
  'Affiliate Commerce Watch',
  'affiliate',
  'Find approved referral programs, product feeds, creative rights, and commission economics.',
  'Research brand and retailer affiliate programs. Capture approval rules, allowed channels, feeds, image/creative rights, deep-link rules, disclosure, commission, exclusions, cookie window, returns treatment, payout timing, geographic limits, and checkout hosts. Never scrape imagery without rights or auto-enroll.',
  'RECOMMEND', 'PAUSED', 1440, 0, true,
  '{"preferOfficialProgramTerms":true,"requireImageRightsEvidence":true,"requireCheckoutHostAllowlist":true,"requireCommissionEconomics":true,"noAutoEnrollment":true,"noAutoPublish":true}'::json
),
(
  'product-economics-watch',
  'Product Economics Watch',
  'economics',
  'Calculate true contribution economics before products earn catalog approval.',
  'Calculate retail or affiliate revenue minus product cost, inbound freight, outbound shipping, payment/platform fees, expected returns, fraud/warranty reserves, authentication cost, and customer acquisition cost. Preserve unknowns and never auto-change live prices.',
  'RECOMMEND', 'PAUSED', 1440, 0, true,
  '{"requireCostCompleteness":true,"preserveUnknowns":true,"noAutoPriceChange":true}'::json
),
(
  'product-safety-recall-watch',
  'Product Safety & Recall Watch',
  'risk',
  'Track recall and safety evidence relevant to proposed or active product categories.',
  'Monitor authoritative recall and product-safety sources for matching identifiers. Preserve exact source, identifier, date, affected model/lot scope, and status. Fuzzy matches require review and must not silently become confirmed recalls.',
  'OBSERVE', 'PAUSED', 1440, 0, true,
  '{"preferGovernmentAndManufacturerSources":true,"requireExactIdentifierWhenAvailable":true,"noAutoCatalogMutation":true}'::json
),
(
  'brand-authorization-watch',
  'Brand Authorization Watch',
  'trust',
  'Track whether Acre Era has the right relationship to sell, refer, or display each brand.',
  'Track brand-direct authorization, distributor authorization, affiliate approval, reseller certificates, marketplace restrictions, trademark/logo permissions, image rights, and expiration/revocation dates. Keep SELL, REFER, DISPLAY_IMAGE, and USE_LOGO permissions separate.',
  'OBSERVE', 'PAUSED', 10080, 0, true,
  '{"requireDocumentedAuthority":true,"separateSellReferImageLogoRights":true,"noAutoCatalogMutation":true}'::json
)
ON CONFLICT (slug) DO NOTHING;
