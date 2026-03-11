SELECT 'licensing_unique_payment_intent' AS check_name,
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'licenses_payment_intent_id_uq') AS pass;
SELECT 'licensing_unique_license_hash' AS check_name,
       EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'licenses_license_key_hash_uq') AS pass;
SELECT conname, contype, confdeltype
FROM pg_constraint
WHERE contype='f'
ORDER BY conname;
