SELECT 'gateway_unique_license_deliveries_payment_intent' AS check_name,
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'license_deliveries_payment_intent_id_uq') AS pass;
SELECT 'gateway_unique_license_claim_code_hash' AS check_name,
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'license_claims_claim_code_hash_uq') AS pass;
SELECT conname, contype, confdeltype
FROM pg_constraint
WHERE contype='f'
ORDER BY conname;
