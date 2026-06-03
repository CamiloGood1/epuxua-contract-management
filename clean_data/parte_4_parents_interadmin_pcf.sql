-- ==========================================================
-- PARTE 4: PARENT REFS + INTERADMIN + PCF DETAILS
-- ==========================================================

BEGIN;

UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0c67ae61-2db9-46b7-9ade-8919a2b205c2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'abe8d8fa-90f7-40e8-9477-b460946fc793';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '039afcea-fbf1-4f15-b43a-c791a55aed34';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '34f7ae23-4240-4bcb-97ae-b1c86135c93b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3431-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '71e92ecc-20a9-4297-80f9-671990eac54e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3434-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'caf0c3d4-472a-4c89-9e3e-c41f6608147f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c49d62d2-e8a4-4aae-a2f4-4ca8f0ce38bf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '29e1835e-07ce-4e98-8a64-432730707c3c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '887403c6-633e-438a-8861-da2c5a563f34';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f90a92de-04b7-464e-9d14-9b5534b0a365';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3434-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dcc294c4-cae5-4e0f-acda-24a21ee881ab';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f07f23ac-72b1-4009-880f-ae74a9ae18bc';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '486154c9-0f0f-4768-8fda-40a152d8648f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3446-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '91b08c4e-be51-4d00-b8ba-aea0482acfc2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3429-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '016fe406-331a-4c13-bb3d-41e865590899';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'bfc612b2-28cc-421a-979f-53fd51cf769e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3430-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'bda57a1c-044e-4bae-9a35-0440e50680fe';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3ca4cb9e-6ab9-42b3-a728-4f36cac0eb12';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '2df52619-5964-47a7-bd7e-67a2c76de19e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3443-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3199dce6-2a17-4cc8-8779-d54bef28a2f3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3443-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b9b7dc4e-854d-40e4-bcd6-1d408438ba19';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '810e24af-e8b8-4571-aeeb-2bfd0303b0f3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '1469560d-475b-42cf-b4c3-26203d64fb65';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '484e2244-89ea-41cf-8514-01522479966d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f9e4c172-7f66-4971-a9e6-a3469c0c951b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fd5ef477-cb3c-4eab-bb72-e0f244d4cff4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a44cb0ce-9464-4be9-9680-6ac053b8165b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b377a312-6e58-44ec-8b41-e1a7f546cce6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'bf793716-5e27-4505-a807-b49fee5010fa';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fd22ab57-f49b-49ca-935c-ef31fe88acb0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '2c56c174-f19b-45f3-bb4f-3cab98e246b5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '78ad496b-7a42-4412-8892-774da0558d49';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '43f9ac94-25e8-43a5-8293-78cec8bbec8b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '31efda33-bd82-4b6d-ab37-b47fb37947cf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '575fea72-d21a-44ed-b537-a7b10912418b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4201-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'db794903-3124-49f9-9d92-6334c24de7b1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '954ec7a8-0b54-4944-ad42-6b7b5d3f6140';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0f2a773e-be1d-4e6c-a381-b3f0a11c6360';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4196-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fb89ba13-b470-4497-be18-a612b0aac95a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4196-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'efae0ad0-57df-4afb-8f44-78c2688dd642';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9d72ec03-d0b0-4696-8446-cc6a73f9bf56';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c94fc661-ad7d-4249-bdc7-0cf6fd61e916';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '36759369-0d1c-4396-affc-02d74bef6927';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a9a80261-33bf-44fd-b7cb-58174a4fee6b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3874-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ce12711f-660f-4a54-86e7-ec696945da7d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3830-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8f4311dc-7e9b-44da-8483-76c9e441418e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3874-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fcb0cc3a-84d2-4adf-8131-f37e2188257c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3822-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dfad2c81-fd8e-435b-a85a-4dec964507ae';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3822-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '208dec54-eab1-403b-befd-49e75d7e8d9d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '1c681dd3-38f1-4f71-91c8-da4ee1c0c566';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3977-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '96f6abd8-fedc-4306-9e39-572ae871c37c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b975620b-32b4-41ff-b0b4-7118cab316ab';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3977-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3b3542a6-550a-4e1e-8bbe-e2de978993e8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '0499-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5738cc7d-f86c-4efd-900e-3187ee7027c3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '554-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'be1e59da-c246-466d-8f56-cdd16ba841ee';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '554-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '264d05d0-fd14-449f-91de-5f6c4ac7ac14';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1410-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7029d9e0-0af1-4832-aa41-d7ecc7990318';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1410-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5d82a379-a6ac-4528-adc5-3c708fd91c7a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9cff940c-4c3f-4b03-a63d-b17c158f5d10';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1532-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '04fa335b-5001-4354-a8f2-c1f66784ecb5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '140-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4f4946e2-7a15-4ecb-bb5e-a0f0f9672e7d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '24729f80-52c4-4fe2-a957-9cef5ade258a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '2c99814e-d463-4bc6-a95a-56e97809d354';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'cc9614ee-895f-4509-9fe0-204b9d286257';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1937-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f9722429-20f2-4746-8f52-9fa3ce1655e6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '56347616-28b1-4976-aeb7-f34c9943f42a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '88276278-f7b5-48b1-b5af-2a9f3e81654e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '699945b9-e4ee-4f07-a61e-4dc0140e6e1d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '04ad9dda-5c00-454e-a7c9-1be4ff5ddeac';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '189db570-5e35-4096-b263-b91ddcd93421';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1639-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4c8aec85-3449-47a5-9932-eb6f3fc04e17';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '15e65939-a812-42df-bc54-a8d543e509ca';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '573aaabc-cfda-4cef-a70d-d94fb36bd849';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'aeb7e378-47e0-4a3c-9561-58a5e1ffac09';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'cea153ee-17e1-4cfa-abdc-1083de44b283';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '86c03eb2-6785-4d0e-a44e-8026aa2b733a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '785811df-8e26-45f4-ac6c-0ccd6e813a84';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'efc5df19-5e77-4ee4-a149-aef91070a015';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8046e26e-63a3-4812-a540-08b0fdd4d8e6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b2c7558b-d7d1-4d4c-a3a1-7f809e0ad1d4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6f14309d-5acf-446e-80e1-92490bd128b4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e951d889-fa5a-47fe-8efc-6cef8ca362f6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a764ce92-fd4d-46b9-897b-6d20f3b823d0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '140-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '71ca40fa-96df-49d9-a123-bfd8109bebdf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ab7e40c5-31af-4601-8e1a-bf1a0d4e4d9f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '21773929-c942-4d80-9a91-cca1b099f237';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6bc7c4a0-3b36-4d3c-90a9-12fb460be66a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3071-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e0f10d46-8157-44b0-a1a3-7a341b58b7b2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3109-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '807a99d3-bbff-4a55-b7f2-53df8c17601b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '68ed125d-a596-4458-89ca-22bf8eb62cb9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e4595b51-8f1e-4da1-8b34-30058d3e8be1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4c876b08-ac76-4900-b3d4-b8a37d8019b5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3109-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '66ff4410-b883-44a9-b350-59d420aac795';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3272-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5e53591c-3b23-45ef-b091-f8a99f740b13';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3272-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5c53b48c-0a02-4e9a-81bf-8e00422cf02d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f6efec8c-f364-4562-a29d-39be5524d66c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '86192646-2279-4fa7-9924-94c76296ae94';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b66d074d-b8d2-410f-9bdb-957544243458';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5d10fc0c-a544-4f6c-b214-1bdbdfa1b2f3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8af3e1d6-f27c-4bb7-9de1-118972854e31';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c23d4b44-93ab-4121-8122-16c2a52ae43b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dae786cb-0b36-430b-836d-6c1e6d689e2f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3074-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4dda4aa7-0af6-4c51-b747-6dc33c27cc8b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '29158ea9-a0ae-454d-89d6-35ed035d578f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '084bd1db-0cab-4481-8ca9-870fc545b896';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '326ac01d-63c1-4687-881f-d065ce40c9ac';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3074-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '67c0e1a7-3253-4d65-b78c-670b9651c21f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '568-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '01ab81c8-5807-4959-b550-bf66d53126c2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1671-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3b7c0fa8-4857-401a-ad40-def85469cfca';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '172-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b5347c81-eaf8-469d-b3df-e9fda8a7c3de';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f03194e1-20f0-4ec4-8487-2ef19c606e3e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '79fc927e-c9ca-4f5d-bee6-51298eee622a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '235bed71-809d-4f04-9681-56814bf4d1b4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7a749f6e-7ce2-4676-8070-7d453b44d45f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fa4ea711-c786-4920-98c5-f68264f1cc18';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'da209b72-adec-45a9-ad30-38ed047cd28d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd2105dd8-e601-4e54-b32a-9d4e3dbb0688';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '62b59766-2cc4-466c-96a5-231a4d6d3815';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'db3d0107-066d-4e30-bb22-2ebd424e3489';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f835bc24-d839-4867-ac28-e2e66329c663';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '1e5e4d96-e695-40f6-badc-76d1480c3ef7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9c7f3b9f-a530-4f0a-b3b9-28504ea74e86';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e5289939-b2ec-4024-8ebc-55767f73f467';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3e5fd502-e9bb-4b2e-a39a-0ca8fb389418';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '54cab31a-1aa9-4599-b1a5-dd988d7a7811';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dddcaf55-b683-4265-b5a4-18d65d58bc88';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '091a3571-31e1-467c-ad63-bdb500776447';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b8a94ead-0240-4126-8f7d-6f21e2fe411a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '50fb78e9-c806-4ce5-baa4-c34d3bf0c653';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6d4c780b-5aa0-4ec6-af65-ac30e0ea055c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a81c03b2-cf23-4ddb-83de-0d45b7516d4b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '19ba2101-a0d0-4359-9465-3e00b09c09d8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '02b8b420-819f-4a3d-bd1c-833cf5d0a383';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4d3fac51-c791-4303-902e-88ebcf98217a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6cd3277c-3e66-4fe7-b3c5-17d2846be1e8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '726bba84-aeb9-4087-a498-880f40be165f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e79824f4-5fb7-40ce-8c41-4bdacb72989a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0de52ce3-1d78-4613-b736-d83672e29258';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a72e0425-24fa-46b0-aa1f-4caecf6dd486';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0d9b1b13-f8a1-4256-9608-3b7b26b73afb';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'db9fb77b-291b-4a17-9f88-13454898fcbc';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '644306b0-59ea-4741-9a00-5f058b1393a6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3b2fd4fa-beb0-4180-b751-db9c4d856e9d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8b15033f-1330-4220-bc1b-91a0e374904c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ddd4aa64-010e-4cb6-9c9a-eb0695351448';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6b13d361-b0a1-42ce-ac0f-4c96f45dc7f8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e122495e-15b5-4503-bb86-dfbeaefa701e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '46953591-c177-423b-bb93-031095fea3d0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ab37e4c8-23df-4a13-8f45-1023a9e9c4b0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dfec33c3-81fb-4fec-b6e1-71cbdbe03c94';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '048cf35d-7f54-4301-bf83-d4870acd4d1a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e773de32-b899-4f83-931b-57c18544e0e1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2359-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8e3cc30b-f062-482c-bf60-d23425a6bee1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7a6a1292-6221-409e-90ef-348e8e7374b9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2474-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f4eaa0f1-d705-4223-83df-285b35c8f3ea';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fbd65573-b38c-43f7-98cf-1600d851809d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2359-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '94229b3b-1a9e-4e44-a49c-a94273722620';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2510-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e28fbed7-c003-4cf7-9505-4ce5de517666';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7ce07162-b082-4bba-92a8-a9f00b009f5b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '02257-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0b50b530-3bad-49b2-b9a6-24994b6bdeeb';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '02257-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c3053be7-be2f-430f-98fa-378997a63a3d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2423-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4c66bf1e-6953-4cd0-96e9-1a4ba949a013';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '979-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a25e84b2-c9c3-417e-b5cb-bc820ef355e9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '376-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6c1df568-1ba5-4b62-b9a5-2d818445c4f2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2423-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b6a4eb0c-147c-47ea-bfac-0a7d9fa97ab7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '376-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '50eb5f4d-3fc5-4b50-ab66-91499744e487';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '979-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'db838e3c-799e-460f-a084-a6d800a6d9ff';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2511-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6e8898c0-7374-44b1-a2b0-f9f377c8d7aa';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2511-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '221e315d-813d-455d-b1f1-565d6f2c8336';

INSERT INTO interadmin_contract_details (id, contract_id, secretaria, admin_fee_initial, admin_fee_additions, mandate_pool_initial, mandate_pool_additions, pending_collection)
VALUES
  ('ed2415eb-e7e8-4511-a8c6-e9dfcb4f7ff3', '0cec3390-ed1f-43d3-970c-81eee01e0d46', 'Secretaria de Educación', 315250625.59, 60912969.73, 3784521316.0, 731248136.0, 0.0),
  ('6cc7457a-4da8-471f-bed0-d243e871bf4d', 'a7ef0a53-5c3f-4ff3-830c-e5b11fa65a05', 'Secretaria de Infraestructura', 26771546.0, 6256829.37, 321387109.0, 75111997.35, 0.0),
  ('b48354a6-1615-499f-8853-a5f2a3de1723', '00cc3433-c762-48bc-8837-e4ca5aa793a9', 'Secretaria de Infraestructura', 49271286.0, 5442822.0, 591492030.0, 65340000.0, 0.0),
  ('dde8366b-6ff2-430d-ad65-0c8ddcfee54c', '4e508581-1ac0-45fc-ae11-69241598c673', 'Secretaria de Infraestructura', 673132645.73, 233180860.4, 8080824078.0, 2813013257.0, 0.0),
  ('9df754fc-556f-41de-888d-8bdd783fac0a', '022f94b3-e038-4b3a-b02f-9b6565e4be6a', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('ca42bf81-2c97-4953-9483-1eb9c2ff4845', 'c4178aa6-b46b-412c-9186-c6d5b3f8ff86', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('87c72da5-6511-4b4e-bca7-f7d78f14c5ae', '224f61bd-b0bc-49cc-ac02-5e4966800ddb', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('deaa72cd-abae-449a-b5f9-e745e3ade3e7', '905de2a8-8688-484e-b46f-5921622f2fd4', 'Secretaria de Gobierno', 1542695067.57, 778328381.31, 22038500965.0, 10792700883.0, 0.0),
  ('ca617698-e61a-46cd-a4b9-b8989bcd3064', '434c3565-978e-42d5-941b-28be6858cbab', 'Secretaria General', 0.0, 0.0, 1000000000.0, 0.0, 0.0),
  ('fe045c0e-a0e7-4bf1-a7ed-bc485fd9797f', 'c518ff34-b480-4871-b831-90547ec53b22', 'Secretaria de Infraestructura', 375397105.96, 187642787.0, 4731896294.0, 2365245219.0, 0.0),
  ('2fe2bccc-6de7-4154-86f6-e85657cdb564', '92d0050c-45cd-484b-ae47-b2692a7bcfbe', 'Secretaria general', 554911685.2, 0.0, 6661604865.0, 0.0, 0.0),
  ('800915c6-d4b0-4647-bd81-fb0007410fdc', '41e17724-69e0-4d94-85c8-4c77ceea4c82', 'Secretaria general', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('22adf2e3-07c8-4416-a9c3-e313947dcfe0', '9c8efb2f-276a-4a19-888f-5ec5ae05b9a5', 'Secretaria de Cultura y turismo', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('683af867-4752-4570-be9c-ebc8e286e0b2', '18d4ba2b-9bf0-4faa-870f-7edffcc24a7a', 'Secretaria de Educación', 111551533.94, 17610230.28, 1731054055.0, 234449792.3, 0.0),
  ('6e2652d8-a77e-42a3-91df-2254161ef05c', 'd1ee53c1-c4b2-4933-bcec-6773f0298332', 'Secretaria de Infraestructura', 182549972.04, 57417425.9, 2191476255.0, 820248941.4, 0.0),
  ('8458e604-2218-46dc-be9d-3a0447fa5024', '00087ed2-332b-4338-841f-9a6d3b6cc8d3', 'Secretaria de Infraestructura', 152771822.0, 8728904.1, 1833995464.0, 104788764.7, 0.0),
  ('02769117-2635-464e-a0ee-32243d10ce86', '15532d78-38bd-464d-9152-9670aa681f8f', 'Secretaria de Movilidad', 60000000.0, 0.0, 439990600.0, 0.0, 0.0),
  ('068144db-1db9-4af4-877e-c83e54188b0a', 'f02146b8-787b-48cd-b510-885713390111', 'Secretaria de Infraestructura', 1316587963.09, 135358248.37, 1316587936.09, 135358248.37, 0.0),
  ('c8e96f96-b296-4542-97e2-f016c9206af9', '780d9648-ec98-4e7c-8747-d5bc2ee7261a', 'Secretaria de Infraestructura', 1129819040.19, 0.0, 13563253784.0, 0.0, 0.0),
  ('064417c2-98f5-4d12-9706-fac716a3551f', 'a80429a6-4d3d-4c17-be64-a7cd8c7cff07', 'Secretaria de Infraestructura', 2010021613.0, 192684145.06, 13278477692.0, 3201896570.0, 0.0),
  ('305d7fcf-159d-42b8-ad70-98ff0fe9f01f', '8fd24c34-499e-492d-bf11-1d6b65dd9b1b', 'Secretaria de Cultura y turismo', 55746826.49, 0.0, 506191057.7, 0.0, 0.0),
  ('877379c2-19be-4560-8f4c-de38a814c58b', '6be48ed9-a819-4de1-a30d-5c61c715a98f', 'Secretaria de Cultura y turismo', 360000000.0, 0.0, 2640000000.0, 0.0, 0.0),
  ('2af28c79-68fe-4152-96e9-47b495c23bf0', 'f9bdce78-89ea-4510-b62e-a265e71facd8', 'Secretaria de Cultura y turismo', 369438968.13, 0.0, 3267925415.0, 0.0, 0.0),
  ('1bb604de-9c21-440b-974b-6dee28ec691d', '58834fdd-9b31-42a2-af5f-802d3f8b0b89', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('6452337d-9a60-47d1-8df9-d7567d6c9a05', '939f53f3-ac9c-427c-a173-c20654548fe0', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('895e84d3-69fb-4fce-8c7c-2787042769d5', '65f559a3-e103-4625-9801-2c8b7684ddd7', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('620a49ef-f265-4107-94f8-f9a58dc8ed5d', '0aba8da7-79e5-4b9d-bc86-7ba5bed286c3', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('e9987048-cb0c-4acd-ac83-72f89392f9a0', '9b62d476-e634-438e-a906-651b126615e3', 'Secretaria de Educación', 35507576.0, 0.0, 1183585851.0, 0.0, 0.0),
  ('efd8b930-d376-404c-baa7-15ea4c4d73a0', '6cbaacbe-adc3-4489-92e8-92e379a33760', 'Secretaria de Cultura y turismo', 23324621.98, 0.0, 326675378.0, 0.0, 0.0),
  ('aa940a04-801e-4fa9-82e8-4ea27a8f4982', '499a9beb-148a-454c-86d1-2727da349167', 'Secretaria General', 46649243.98, 0.0, 653350756.0, 30000000.0, 0.0),
  ('6e307752-e4f6-457f-9431-7e378ee748bc', 'e35c10d9-a45f-4369-9fbd-53c709d96a9f', 'Secretaria de planeación', 6497600.0, 0.0, 78002400.0, 0.0, 0.0),
  ('7bcf5dbb-ce0e-4cf4-aaed-4127c3753cdf', '943a2c84-b2c5-495f-8e15-fb845d6ee2a6', 'Alcladia Municipal de Girardot Instituto Municipal de Turismo Cultura y Fomento de Girardot', 21086560.0, 0.0, 421731194.0, 0.0, 0.0),
  ('a49fdc54-12bb-4b8d-8022-981d420255f7', '809ab298-0758-4357-951c-2fe667cceef8', 'Secretaria de Educación', 17685774.94, 0.0, 212314225.1, 0.0, 0.0),
  ('8377cf2f-0607-4f37-ad94-95f90b2bea8a', '97195859-ea8f-489f-b9d2-0f43ff26f45a', 'Secretaria de Ambiente', 19626168.0, 6757009.35, 280373832.0, 41442990.65, 0.0),
  ('a3322247-46a9-42db-a271-9b5ea6809578', 'c2e29743-22c4-4409-8ab9-4aa1af5048ef', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 19223668.0, 0.0, 230776332.0, 0.0, 0.0),
  ('4617f27d-295f-4f5b-ba6a-e10cd0ef017e', 'b6992bf3-481c-4c2e-8cbb-49146d91eefb', 'Secretaria de Gobierno', 5978859.0, 1428571.0, 100506167.0, 28571429.0, 0.0),
  ('e673b76f-2e6b-40fe-8c73-041bffaae0af', '3ba2cc8d-13c3-46ed-9d85-f86773b7fe6a', 'Secretaria de Infraestructura', 230684021.05, 0.0, 2769315979.0, 0.0, 0.0),
  ('7d5e6d1b-d18d-4745-85fb-f2d9ebdb59e1', '20fb0f40-7399-4438-9fb5-d417c2543d0d', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('bf73c4b7-0b91-48f9-be33-2bcfa0ceae96', 'aad6bf36-a0ca-4255-9d84-17deab70f1c1', 'Secretaria de Infraestructura', 3557094768.0, 0.0, 142283790.0, 0.0, 0.0),
  ('e6d277ae-2a47-4034-a5cc-4fa0cdeec2c6', '14163aef-a43c-4199-8cb7-273af7fb50e1', 'Secretaria de infraestructura', 8005850000.0, 0.0, 640468000.0, 0.0, 0.0),
  ('f6744827-4486-4971-b9d7-f32d2500db55', '74394094-4a4c-4a26-aabf-4ff2e688d029', 'Secretaria de Cultura', 3502790823.36, 498824775.0, 269329382.7, 38354607.71, 0.0),
  ('09424022-11b7-493a-83cc-bb6de84f23ad', '85144d13-52b8-4e9f-bd30-7cf3aedb87ba', 'ALCALDIA MUNICIPAL DE SAN BERNARDO CUNDINAMARCA', 319544072.0, 0.0, 26618021.0, 0.0, 0.0),
  ('bf7dbb75-d04a-4554-a906-8cfcd826bdb1', 'c42fc4ef-2993-44d6-8911-019ef3997a47', 'Secretaria de desarrollo Social', 78221760.0, 0.0, 5585037.0, 0.0, 0.0),
  ('4f7a4e3b-6fbd-4be9-88a3-04b40a419906', '511a3f7b-43da-498e-81d1-b058ff0ed3ba', 'Secretaria de Gobierno', 356437542.0, 0.0, 25449640.0, 0.0, 0.0),
  ('8a3b2a18-7cc6-4a0f-9f07-7b90ae10dd3a', 'b1d58174-46c2-43b7-a643-4fdf8c24c4e8', 'Alcladia Municipal de Girardot', 1262058944.0, 0.0, 82541221.0, 0.0, 0.0),
  ('2c54a7f5-b941-4b65-987c-7f9e7be76924', '7b976bc6-38e1-46ae-896e-03118e8a2ad1', 'Secretaria de infraestructura', 278200000.0, 0.0, 3477500000.0, 0.0, 0.0),
  ('67d9b105-356d-4a2e-8f1f-725a98a5951e', 'bd6d486f-68b6-4e24-8136-3962b616b7fc', 'SECRETARIA DE CULTURA Y TURISMO MARIO ALBERTO FONSECA DIAZ', 1392900000.0, 0.0, 107100000.0, 430756000.0, 0.0),
  ('ed4c6211-65ce-4c87-a740-6c417544a2b8', 'ea4cdbda-9b42-494f-86b2-c582fba82692', 'Alcaldia de Girardot', 356036200.0, 0.0, 24922534.0, 41629634.0, 0.0),
  ('6571a7cf-f7c7-440a-b144-eb2d699fe9cf', '8d810f86-84e6-403a-b58a-2a5953df0130', 'Secretaria de planeación', 9132075472.0, 0.0, 547924528.0, 0.0, 0.0),
  ('80f74772-2ad0-4394-a3d7-0dcfcea181c0', '1e5f9c0b-04d6-4639-9d2a-bdd5c0b265aa', 'Secretaria de infraestructura', 3738317757.0, 32700000.0, 261682243.0, 467300000.0, 0.0),
  ('619ca556-cb5f-4083-8c3d-89e1edb8c67b', '311a0ee8-6139-4bb7-a379-e97b1a291954', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 282000000.0, 0.0, 18000000.0, 0.0, 0.0),
  ('78647bba-55a6-4ee9-8f9f-5b0373a38f96', '3b7e7935-f41e-4fbc-997b-e2bf8806e93d', 'Secretaria de infraestructura', 508585108.51, 0.0, 7265501550.0, 0.0, 0.0),
  ('6ace306c-a7e6-4383-a917-66d5bb0ee879', '17e80e4e-5b6c-4968-8e6c-5b8159323538', 'Alcaldia de Soacha', 125223897.7, 0.0, 1753836102.0, 0.0, 0.0),
  ('1e2d1fac-5380-44d3-864d-d539d6610031', 'cc41991a-f895-4feb-a7b2-dfc41deb4800', 'Secretaria de Ambiente', 33935432.0, 0.0, 449192901.0, 0.0, 0.0),
  ('c21c832e-e84f-4889-a683-8a5674bd64b5', 'af880cbb-fe25-41fd-8ef4-3f418128ca73', 'Secretaria de infraestructura', 566037736.0, 0.0, 9433962264.0, 0.0, 0.0),
  ('d72bbfee-9d54-4a6d-a938-c22363530121', 'd45887c3-54d9-44f9-822c-928aa7a45f10', 'Secretaria de Cultura y turismo', 35000000000.0, 0.0, 2100000000.0, 0.0, 0.0),
  ('c8cf5a7e-b48b-4ffe-a524-24ca8aeb0393', '6ba88043-7612-411b-8fb3-73e332b6040b', 'Secretaria de infraestructura', 1421100000.0, 0.0, 23685000000.0, 0.0, 0.0),
  ('4fe1c6ca-69c3-44ab-a60a-4ad1f22522e1', 'fb4066ac-9f89-48c0-a3c7-854692c3dc95', 'Secretaria de desarrollo Social', 480000000.0, 0.0, 8000000000.0, 0.0, 0.0),
  ('ecc3c271-8ac9-405a-a31f-d4115451fb6d', 'e49c0546-7334-4efc-baa5-c35215c3cd41', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 600000000.0, 0.0, 10000000000.0, 0.0, 0.0),
  ('ca667ec2-0743-4534-95c4-30036b71bde5', '73658a25-8663-4ad7-ae70-dc38909f9674', 'Secretaria de infraestructura', 180000000.0, 187680000.0, 4500000000.0, 12000000.0, 0.0),
  ('c92e4f17-a0fd-411e-813c-b7ccf2fc9c32', '2eaee500-b0d4-425f-85d4-0bf0ecd9f7c6', 'Secretaria de Gobierno', 10199972.0, 0.0, 169999538.0, 0.0, 0.0),
  ('a4385e92-08e5-4a5d-b392-13c2a67fec6a', '1205fca0-ae4e-4a33-86d5-5acac99ab8c3', 'Secretaria de infraestructura', 672545527.0, 0.0, 11209092136.0, 0.0, 0.0),
  ('86fe9980-90ca-4d1b-807b-a5f47f254c86', 'cf2d180d-fd71-4323-9ee7-8b956da63269', 'Secretaria de Gobierno', 176916792.0, 0.0, 2771696401.0, 0.0, 0.0),
  ('d90db842-4281-4a8d-973d-bdc7fa5d3414', 'cb29a7f2-85f8-40ad-8360-8202ab93f5be', 'Secretaria de infraestructura', 20700000.0, 0.0, 345000000.0, 0.0, 0.0),
  ('4bbce14d-eae6-4b2a-8b8f-7c90d14e89b8', 'edd06b7e-72e2-4a0a-b823-aded7f370620', 'Alcaldia de Girardot', 162840463.86, 0.0, 2624998576.0, 0.0, 0.0)
ON CONFLICT (contract_id) DO NOTHING;

INSERT INTO invoice_payment_details (id, contract_id, committee_number, committee_act_info, invoice_date, requesting_officer)
VALUES
  ('8b29fa85-e06b-4c72-9b03-a8d4f38dca67', '3b534564-98d8-49c1-9711-d33c7a30ae71', NULL, NULL, '2024-01-24', NULL),
  ('c7cb9af5-52ab-4dc9-9e43-66b01b392363', '03fd3b90-74ee-4579-8d71-ad78d53bce6a', NULL, NULL, '2024-04-29', NULL),
  ('9175db8e-3664-48d1-b347-fea53d79607b', 'b7ccfb09-b7e7-452d-97a6-e6ac0ccc0db7', NULL, NULL, '2024-05-28', NULL),
  ('76cec8ba-17f1-41ab-926e-4c8990ef9617', '92260143-fb16-474c-ac71-33f8e3029a5f', NULL, NULL, '2024-05-10', NULL),
  ('cdf72804-08cc-44fb-9c10-67fdbebf7e4f', 'aae2121e-ad7a-432e-b588-5d41e6665b15', NULL, NULL, '2024-05-17', NULL),
  ('2868d8b2-a462-4705-bd1f-60c7b5bf5dac', 'ce42eaad-e29c-469c-b911-7ecc4b7e0c47', NULL, NULL, '2024-05-28', NULL),
  ('87b39e3f-388e-4254-8ed1-666671850ed4', 'a647edb7-063a-4ed2-be3e-c379c9b2f134', NULL, NULL, '2024-05-29', NULL),
  ('058af816-2f8a-45ab-a2d9-b6b2e4de9800', '1da420d9-12ae-47b5-8e4a-7bd0ef537922', NULL, NULL, '2024-07-12', NULL),
  ('7f6f2963-cf6e-48bf-b058-84dde7f42e6f', 'd1dc8426-af39-4744-9de7-cfe8e7e9dceb', NULL, NULL, '2024-07-12', NULL),
  ('5f2eb4a8-f6c6-437d-a5c9-89ecc70f1815', 'a47982d3-2e47-4c99-b94d-cdc8634741b5', NULL, NULL, '2024-12-31', NULL),
  ('45474608-75ee-4e16-8784-b574ed1665b6', 'b5bc3aec-4381-49d0-86cf-c6cadac7d312', NULL, NULL, '2024-08-08', NULL),
  ('99812515-74e6-4278-91dd-73583ad54ce6', 'bdd6f787-4401-441a-aa96-257c3ae2f6a9', NULL, NULL, '2024-12-31', NULL),
  ('5aedb353-8bb6-4a0b-b41e-932ecc3026d3', 'bae74caf-b057-4d78-8661-37711443ac66', NULL, NULL, '2024-10-07', NULL),
  ('cff4a452-80d4-48df-9223-a5c58fcc59cc', 'b65539b5-790c-4865-a24e-c8e948306090', NULL, NULL, '2024-10-07', NULL),
  ('34d466dd-c1c7-4db8-a56a-d9f045b678bc', 'f799f174-6710-43f7-8e1d-f858dddc9016', NULL, NULL, '2024-10-01', NULL),
  ('2c0164e2-dfe0-4ab8-901d-37ac6ed6734a', '7b97b133-411e-4272-b76f-e5c6d982f78e', NULL, NULL, '2024-09-29', NULL),
  ('74ffa6ab-2e16-4cae-9f35-0211f7121bed', '6454a9b9-4421-46a9-ab55-ebe9ce2d6363', NULL, NULL, '2024-09-29', NULL),
  ('ef8709cc-ce42-416b-90fc-8d78612ff068', 'bfa1aa09-2d10-43e6-a40e-cf9662a66e12', NULL, NULL, '2024-12-31', NULL),
  ('767ca0ee-c35a-44db-b0c7-f10185fad5a4', '73feaf79-820f-44f5-b7e8-5efb0a10801d', NULL, NULL, '2024-12-31', NULL),
  ('8c54fbcf-cfd9-4459-a594-00673a5d5b4c', '0d51b74b-bd21-4f0f-8d6e-03d8d95596a8', NULL, NULL, '2024-12-31', NULL),
  ('a8e02c9e-1b11-4dbd-8145-07f0a0f50b26', '07945fdb-126a-4790-84eb-03caf539989f', NULL, NULL, '2024-12-30', NULL),
  ('bd936a7b-94a3-49e8-a231-c6260a234fcd', '8adb7a93-503d-4c20-9396-a06111c8b897', NULL, NULL, '2024-12-31', NULL),
  ('7241a085-fd58-46bb-a1ef-f83016fa22a3', 'e0c3b6ab-1da6-47ec-ade9-e2ce64120a07', NULL, NULL, NULL, NULL),
  ('dc15eb1a-dcbd-4eb9-acd3-d2b4fecebae1', '8d5b2b2e-a1ef-495c-8104-cb350486683a', NULL, NULL, '2024-10-18', NULL),
  ('7baddb0c-401e-4e89-be4f-f001f487830b', '04e15e55-4406-4c43-8727-ab2e42e51642', NULL, NULL, '2024-12-31', NULL),
  ('86c6ce30-56af-41ef-94dc-9def62529643', '4323f356-29af-42f3-9c7a-1f586f1923ab', NULL, NULL, '2024-12-05', NULL),
  ('ea1074fb-33d2-4855-95b5-589f727c4e3b', '316e0dbc-2a87-4647-adfb-046b1a1585be', NULL, NULL, '2024-12-31', NULL),
  ('37e698ac-097a-4ef2-870b-0ac27a93d92b', 'e67fcc00-7673-43a6-87bd-39073a07b5d3', NULL, NULL, '2024-12-24', NULL),
  ('c7781c5e-5fd0-41c5-afeb-98e7b8174288', '1f55f604-65e2-4d83-8f4d-773db08a8957', NULL, NULL, '2024-12-31', NULL),
  ('1f1c4cb1-7c9c-46ab-b19d-bae0bae95215', '6eeed292-aca9-4650-a44b-92da4ef52618', NULL, NULL, '2024-12-26', NULL),
  ('68f5ad5b-4bfa-4120-9347-475e0b186695', '912bb863-59e0-4326-a8e2-789c75488e83', NULL, NULL, NULL, NULL),
  ('d99d70ff-06a3-4bf4-98f6-acaa57e507d6', '63e4da01-cd2b-4ae0-a8e4-242e03029009', NULL, NULL, NULL, NULL),
  ('021d9e86-2e90-4797-8b50-04fc4f118d05', 'a1f74b79-09eb-40a4-8423-62c928ef0bf9', '95.0', NULL, '2025-02-28', NULL),
  ('c58dbbd3-ca83-4ba0-8d30-47a8ba2cd860', '9770c538-f6eb-4ee9-801f-52af0cc0d9f8', '95.0', NULL, '2025-09-24', NULL),
  ('a38cacc4-9145-4f2d-81d4-84143c65095f', '79c819f4-afde-4884-ba56-5c1a0eebf4a1', '95.0', NULL, '2025-05-02', NULL),
  ('efc712e7-e45a-4b3e-a212-846816dc268b', 'e40cbc18-5db3-483d-80a6-b0382aca5127', '98.0', NULL, '2025-03-19', NULL),
  ('4ba994b2-083f-4a24-9400-49aa404b2437', 'e84492fe-76e0-4db8-9803-c9b719a74f8d', '98.0', NULL, '2025-03-20', NULL),
  ('a3c4ac24-19a6-4ec3-8b3d-0f9e2aa9c6a5', '8ba8436f-99cb-45ce-85df-be8f3db9f4a2', NULL, NULL, '2024-11-29', NULL),
  ('3b4b5c85-0ae9-4b9a-8b07-f4802ab93565', '0a1c19c2-92ab-4aa3-bcbc-5e79d689511f', '100.0', NULL, '2025-03-31', NULL),
  ('2f998646-fe1a-4808-8179-17e222316caf', 'e4a6dd4a-67b4-46bf-a044-fbcf845ba346', '96.0', NULL, '2025-03-03', NULL),
  ('d678a3c5-8db0-4a8e-afa3-92addc00954d', '7ad0f47a-9fcf-4d2e-b54c-33b87d36dca3', '100.0', NULL, NULL, NULL),
  ('dd1d957d-4a92-49ec-8aaf-10368e2bf135', '9741f476-753f-41e7-a51b-70e783d77cd7', '100.0', NULL, NULL, NULL),
  ('9bb781fa-faea-4b9f-9f35-2031397772eb', '33aa6fa1-870d-4e78-acae-f6e282131498', '102.0', NULL, NULL, NULL),
  ('14e24149-130e-4615-b0ff-73520e485658', '2d22ee06-081a-48ee-89e5-577ad10a6703', NULL, NULL, NULL, NULL),
  ('0006c519-1da0-434f-bce1-764937078403', 'ca2e87a2-c9c3-444c-b3ac-0eaa0458534e', NULL, NULL, '2025-05-30', NULL),
  ('a5d74060-a00b-434b-8988-565f62224c7b', 'a185ccbd-aeaf-4150-88ca-e718741d1f77', '103.0', NULL, '2025-05-29', NULL),
  ('731d329b-965f-46e2-898f-37104b405869', '22d2e739-98bf-46f8-82db-77b1292b6284', '104.0', NULL, '2025-05-30', NULL),
  ('0ed93932-a437-427e-a396-ca38ffd6ebfc', '23b55a59-38c7-42df-80a9-f7d49c22aeb6', NULL, NULL, '2025-09-01', NULL),
  ('ec32dd4c-6481-48af-8d1c-c7d0e6bfca83', '29b506d8-0495-4b30-94f5-268030082f02', NULL, NULL, '2025-07-10', NULL),
  ('f08f6bc1-6915-4074-a8cf-c0e31b37b379', '4a8bdd66-f729-47f9-9f5f-31f5aac6f0ac', '107.0', NULL, '2025-11-06', NULL),
  ('fbde4b43-7f3c-457e-a9b8-aad4b554ca75', '8ae8af15-46f5-4d39-b033-2a28cbab4ea7', '110.0', NULL, '2025-08-22', NULL),
  ('3160a982-bf1c-4480-baec-f11fd4f65567', '13a3383f-389e-403c-9d01-74905318e20a', '112.0', NULL, '2025-09-01', NULL),
  ('74b129ef-b01f-403a-99e2-6f58704e2365', '825d766c-3014-4b6b-a754-9138af6e1a27', '113.0', NULL, '2025-09-12', NULL),
  ('fe49debd-13d1-4dba-9227-8bda408a54d5', '46514e5e-2782-46cf-a591-c9bf7e3c62bb', '114.0', NULL, '2025-09-18', NULL),
  ('fdf0065d-c13b-4c0a-bef5-268d4db801f7', '81cdbab1-0b11-45df-97bf-355952a4abe6', '115.0', NULL, '2025-09-26', NULL),
  ('261a207b-3796-4009-a68b-022651b1880a', 'c8ce90cc-306a-4395-83dd-b7a3d830f57f', '112.0', NULL, NULL, NULL),
  ('c03b7df7-e1fc-48a8-a6da-aa29d063076b', '247b3e20-eb01-468f-a412-4db2528b76c5', NULL, NULL, '2025-09-24', NULL),
  ('1ca7e04e-5698-4122-91c1-8c0cf863c593', 'a14e91f9-cc20-4d10-ae2c-ba961b57026e', NULL, NULL, '2025-10-16', NULL),
  ('084d3484-b9b8-4d5b-957b-174de729af56', 'bc2d35e6-682d-4ead-9a24-5a1f386af72c', NULL, NULL, '2025-10-16', NULL),
  ('3c4592c7-615b-4bdd-9a11-bdb711a6e573', '0b9a016d-f4e2-42b4-b4e9-adfcbd487fe2', NULL, NULL, '2025-10-30', NULL),
  ('615b1306-a5c2-42c0-86a1-e571514ef437', '12a37212-6df0-4a38-ba21-c009dc849e9d', NULL, NULL, '2025-11-04', NULL),
  ('b886a84a-80f1-4e2c-a232-28522872e25a', '08f44af8-c0ed-4102-a79e-157755bb0869', NULL, NULL, '2025-11-06', 'MAYRA RINCON'),
  ('a1db4831-4605-4103-b8b6-31773dba037e', '3013edfa-5a7e-4716-89d9-6351775d8b23', NULL, NULL, '2025-11-12', 'MAYRA RINCON'),
  ('89773bcd-dc38-4a67-b107-415860f8e76f', '9edd2195-d37c-410b-b657-5f49e85ad8bc', NULL, NULL, NULL, NULL),
  ('6ed149f8-73bf-415b-b8cd-86e64c5c0b7f', 'f500ff10-0e59-497a-bd09-941aef7c2070', NULL, NULL, '2025-11-18', 'MAYRA RINCON'),
  ('2baf5d56-ed30-49cc-96a5-66c45bff0315', '48393bb3-582a-4a5c-ac6f-cd3f382eb0e2', NULL, NULL, '2025-11-19', 'MAYRA RINCON'),
  ('5696f6f2-fea1-40a0-a72e-a0674bc26843', '71ff2c57-3529-49fa-b077-2821b8250f2c', NULL, NULL, '2025-11-19', 'MAURICIO CORREA'),
  ('418bb7ee-6748-40b1-bdad-a3ad73485364', 'b41b0e02-a97c-4c11-bf73-2a5efe359d3e', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('eb69ebc8-2a43-4cc2-8011-59044da9073c', '5e1854f8-2085-46d5-bea4-7943226d3ffa', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('d8b1f88b-942c-4658-9687-f4edbc07178d', '7c4ae62a-79cb-44eb-b57b-8a72a1cab3e6', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('721b2a59-0232-4f8f-a37e-8fa0b9d52aeb', '12303bca-313f-41ce-a097-d2b0e4ae2caf', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('95b017e2-cd07-42a8-9068-97c0ef8d1a22', '6b48ea34-d929-4cc4-aa10-8e1664c831fa', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('21091fe7-d7a6-4653-a029-25089a11053d', 'c538b4f6-51d9-4255-9fbd-0413bb9133fb', NULL, NULL, NULL, 'YUDILMA PALOMINO'),
  ('cbde4c16-5707-48cf-9ff4-0770a24980d3', 'd7fa8eba-a886-4822-83e0-6697c70d2441', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('db69604d-610d-4db4-9828-930f0f524b2d', 'd08c3312-d5b8-49ba-a041-345fada4a65c', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('af63c5d2-5ab7-4271-8407-ce98fa042d0f', 'e999c035-71c5-4126-8286-13bc2dc7da2f', NULL, NULL, NULL, 'SEBASTIAN OBANDO')
ON CONFLICT (contract_id) DO NOTHING;

SELECT COUNT(*) AS parent_refs FROM contracts WHERE parent_contract_id IS NOT NULL;

COMMIT;
