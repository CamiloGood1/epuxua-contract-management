-- ==========================================================
-- PARTE 4: PARENT REFS + INTERADMIN + PCF DETAILS
-- ==========================================================

BEGIN;

UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd0bccd84-0047-4722-833c-aa266818d39d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ac285e01-7374-406e-81e9-425b55c9a0af';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ea4386bd-0550-4fd0-bca5-92f29841fd73';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e420be8d-4c0b-4a76-9b4f-05df266be8fd';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3431-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '41bbc752-315b-4988-9761-27159d95c3c5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3434-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a463747f-9dbf-41b1-b6d2-bc4a2f3223d1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f5069cb9-8d2b-40f7-bb72-191ccf99c97d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd9a23dc4-c244-4841-9472-bb0377e7a8af';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5babd35b-2c4d-41c8-ad7e-248c6fdf7e97';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5e339573-db40-49c1-a7a0-2c7034b6bc55';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3434-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '956f5f9f-1be7-4d38-9a7e-ecf4464f7225';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '44cccaec-59da-40c4-988b-b88a1be502e5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f744c73f-3791-469f-8e66-632a4214c7e4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3446-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '674fe586-0c01-4c9c-a222-c0278330150b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3429-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8abcd97a-5d14-49f3-b63c-11c3ea21e235';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e2b0952b-dbda-4091-ac0a-da837afd6ba0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3430-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3cac9082-a7fb-4468-970e-093bfdc39570';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9178acb4-715a-4796-a2e5-6cbc4c9cd9b5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd5fa3de0-cfc2-4b89-8fe0-89b8cb148d85';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3443-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6497c26f-d665-4715-81ea-2ba034025abf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3443-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b11bc672-c57f-49c9-afc2-ee332bc37803';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3407-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8ecf1438-d3f6-43f1-a56c-d1cbe8dd8bc8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'af4f5f50-1352-4cff-b8c1-74df9d392840';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7f05f19a-c356-4d38-b752-4f5d8e41fd68';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dc596a1f-5218-4c66-87b1-9eb9c5cab730';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '43726c17-a84c-477d-ae59-ef1547d2f4be';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '09b9b0ae-dc43-45d2-910b-1e48dd86aca4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ca535feb-11b2-41aa-bc80-307524d438c3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'eaf5eeaf-c22a-4737-aed4-59820450a307';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '42f52627-7773-4756-ba52-85edfc99db6b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '09f80d60-c27b-4141-b97e-a3cb547240d3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3437-2021' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ec693bd2-d968-482d-a6d5-8c117c4478a1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '04c4b089-e1c1-4c5f-94d3-04450cb053b5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fa31d417-0bd3-4dea-a921-5cc47ce50750';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4168-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '1f3b5c43-e1ce-4476-931d-85c7144db12a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4201-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'bbd84d17-9287-4114-ac1f-8e37f4a07d4c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c1084585-2718-47be-a641-e543f167fb85';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '52ee09f2-2fc2-4aab-9e78-38be305707f2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4196-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f8313ff5-4cf7-4b85-a433-750b2b148ae3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4196-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '7d8c4703-bd0f-4e33-9a03-ad41b3d4d88f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ac495c43-21a2-4d9e-8d37-7204ea57c9c0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '708011c8-092b-4072-899d-5b87a211e884';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f5d172cf-90f1-4eb6-a4b0-76495386594f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3863-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3c6da88f-f633-48c8-8bac-f8598a7a86d1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3874-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '61084d4c-9288-463f-a0a6-16f2adfcb837';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3830-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b62c9e49-5cc1-41fb-9731-d20cc0dd95d1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3874-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '2cb7dc74-3070-4c2b-8e6f-59c90ac2e827';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3822-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'aea64dcd-0c2c-4571-a2ec-df6f03902987';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3822-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fd958d0b-a572-436e-a380-39b3cd8fb257';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '14c7e6ca-7804-47ed-beb7-be3a35979ff2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3977-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '46bb9213-c56c-4491-9acf-9d4d84dc2a70';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '33632ef3-51fd-4f9e-b43c-26a461b166f2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3977-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c9f40356-e3cb-4885-8889-0ac696ff3008';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '0499-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a3e78db6-7b56-4201-ae90-8a3ae136e93b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '554-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8b0f0345-7a5b-45be-ba12-e730fcca2d31';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '554-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '19d40a2e-7fdc-4d47-a36e-7a8186851a23';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1410-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9b878acb-f085-4424-9d92-8603ff1b53cc';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1410-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '89ec0187-7ea1-4eaa-89b9-4b661003b786';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '63a14c16-c73a-48d1-a6b6-1c98f8ba74a7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1532-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '62a25a6e-d0b7-4988-ac64-7d172f8042e6';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '140-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6d71a6f7-a168-4959-a7b7-e92e966b6c2d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5cd2fa8b-f85c-4c2d-b317-2ca386721e73';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3491cab5-0d99-41d1-9a38-928013d107dd';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b5295058-5660-4a0b-a833-3650d31109f5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1937-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '13c30100-c02e-43c9-a5d0-c640072c64db';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6acd98e4-9419-4f6e-9b67-7d67a0d9978a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c5b0f43c-ee1c-4e77-b98f-0b52a8a47526';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8635330c-bb75-4d37-8533-82b5dc107fcf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'eb3d7b48-17a5-4399-8970-c609b89b5aa7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd75db366-86e1-4a72-8d6a-3a3d69a82b15';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1639-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5c4f8751-9609-4c4b-88cc-3b434179d9e5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '849e42fa-f816-4671-8100-dcde74e7b9d7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4a4f7997-4406-475e-b8d8-2fa0d130ca4d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f60db9a8-8cff-4423-ba31-e94af9acbf61';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5eed7e2c-c5d0-45f8-9988-cfd4dcaa50be';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b128a733-1257-4320-9f13-55fb8af976d5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8d76ff48-fd61-4da5-8928-7ceaaa4b2751';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '47e897f6-f57b-42ba-9488-6380968f1bc4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '83be01aa-c77b-45f2-bdb6-1d9ffe467135';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'f5e9a27f-2d17-425b-971b-1a3e74e1c10f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1297-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '92aa8199-e3da-4bc2-ac1c-ae6716d8860f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a9c43dd9-da6d-423f-9fb7-4bb83e3fb32c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '04465854-becf-4af9-95c5-5fd9ea7c66cf';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '140-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '864f533b-ed23-4e75-b39f-2383e854d726';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5b5a2c82-87d4-4afb-8fb8-82596c253fce';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '44928d38-b2aa-4661-b7dc-1843a0079f91';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5ad8eb0a-ef13-4941-aa34-420fc90618d9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3071-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd59f0ae3-a763-41e6-9eb7-3c52297829ff';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3109-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '985ec20e-a87f-4549-8f09-e2602aa866a9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '167e8704-cb2d-4e31-b875-e41202331ac9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5f515b04-f09e-4238-a682-cccdea59f463';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6f73f493-e4a6-4e0f-b1e1-427a9ff7808e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3109-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b9d22a75-9c97-4e1d-bfd2-5c0b2bc9d788';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3272-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c3d58e8a-00dd-438b-b041-398d131af8b1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3272-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b29a79e4-9a4c-43c5-abb3-5acce5a477ce';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2019-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '52a52dc8-6f43-4df5-942b-7a64647b0e7b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3b609112-ff39-4731-8a93-8a5a878c215c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a037ace1-59d8-4cae-93e2-f02f5e3c280b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '589c80b4-dc74-4038-8f08-86147a1f3e9c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1331-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6bfdeec8-78fc-4c9b-8a3f-fd8459051133';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '27a33a1b-bbaf-4878-afc9-0656b7973577';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '51d89cbd-612d-4cfd-ae0a-d387aa31548b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3074-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e61011d7-ce28-4a18-924a-2a4fe03ef068';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '8d0c6972-94c1-44b2-96af-08926178275c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '77d2d69d-4426-49f3-9723-fa8dc5c5b95c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '654fdd7e-e64e-4a21-9ce3-3c866f4936f5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3074-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '9f81674c-8788-4e10-b0d0-e490d07e2f57';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '568-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '91d7a1d9-ba33-4b87-a117-676869c6e596';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1671-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '5eb8adb9-aeb2-4d01-844b-11a1fd428b27';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '172-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '967cb916-368e-410d-9fe6-58c77198842a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'abc481d6-1266-4ab9-954e-076225b7005b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3279-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '055b081d-6569-4c4f-8c19-d6d4f93bad89';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ccda4702-46ed-478e-a7fc-80e7738fa3ed';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6ad519a0-209a-4fea-b42f-e5c3f574f683';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd751c97d-fa8d-4440-ae74-d9dfcbb229e5';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '598f8d37-554f-4394-a09c-405ef0ceab37';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1653-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a860e479-64b7-4c4a-b467-a4ae5c50f5cd';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a779bfc9-b170-40c6-8ed9-9ec1943f015a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'aeb3ee30-4533-4a04-b94a-0e6dd9957730';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a037d6ee-3e4e-48a5-9998-dfc368c6d4f2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '3572-2023' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '552ca193-579d-44e9-8667-9bea844ed2d8';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c1edd81e-f6c0-4b9d-934a-54e1313869d9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'dcafa541-16f6-4d2d-873e-4262a532a1db';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '3f9f0364-355f-47bd-88bf-0b63194725ab';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b24b1993-a161-47c5-bca0-fbde8e9bfaec';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6f0ab94c-7ac2-457d-aada-7e8d10180280';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c69567d2-56bc-481d-b963-40b70853a903';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '771f5c69-50bb-411f-8425-55272da5bae0';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '90d6d713-5bbd-452e-b4bd-4588a031e956';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ee64195b-138f-48a1-8719-c6ccc6c29a1f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a108f541-6333-49b7-ba0c-7dedd56b1dd1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ec8a6063-05db-4079-81f3-60fd4bd54cff';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ed768705-c92f-442c-a86c-4c0c3aba0f19';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd38f91f7-c55b-4224-be01-cc748cfdbdff';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '92abc3b1-9d1d-4244-bdbc-679b86076b1f';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fe9ec9e2-566a-4f89-a604-f9553ca4f043';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1815-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'ae1430ad-abe2-407f-a89d-e2ccbeeb3642';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c40ec91a-2be2-45d2-9a28-8f73f89350d2';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '144026af-bc13-4bf5-b06c-0da12d48e224';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd2a12bff-132a-44ad-b926-332b3fb45cfc';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fd1bbf51-3aac-4674-9435-0d5efc17fab9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '13add76a-d8ab-41bb-998c-91404136624e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0f3c6e9b-d09b-47a3-ac3c-6b97ad36c464';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '4d95075c-eb3f-4031-8699-53b030f8a989';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '188d68a1-9efa-4dc4-943a-c8bf92ead6d3';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd00ae97e-0e63-43ee-9065-795e63de6ea7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b51766cc-906f-44a5-83bb-858e2076a848';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a13e9584-b9db-474c-85d2-b9109972facc';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2212-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b0cee9b8-9505-40d4-9f5a-0f9c74726c9e';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6c14938c-a7ee-46c4-b98e-4524c764d538';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2489-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '27e01738-4da6-4656-b081-f5da0f0a9e0b';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '6c00fda5-6a4f-4a74-be83-d6113dad9af1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '0684e01c-65d1-4334-83f7-06fc82eb76e4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2359-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'cc332743-ccbf-4943-940b-bdaf440f2d9c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a0332a69-abf2-43c3-bb15-7f7562d24bf4';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2474-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'daa3f8a0-3b11-4dff-9893-345d8401d57c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '4197-2022' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '2c9d0a3d-f461-4c39-89dd-30be92d0441c';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2359-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e2188947-bc5f-4402-aa53-897ebe730bf7';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2510-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '571d62ae-561f-4307-b126-019af06bd36d';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1918-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a6d209be-d1db-407d-84e6-fcfdf5777752';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '02257-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'c78d788c-5d58-43a3-8696-ecf7eb8b75a9';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '02257-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fa59f20e-7f95-4713-8a32-35e686de6c1a';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '55e02946-6651-4dd6-8f4f-13ba46be2436';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '1714-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'a856a5a1-6b17-453a-96b6-a5ce93e3b700';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2423-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'b121f174-c9c5-4bdc-822c-125d7e616157';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '979-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '638537cf-2b88-4479-a600-c2265ad3ae88';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '376-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'd27804af-365f-4a18-a4aa-e33f70acf9cb';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2423-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '67ecc25e-2de7-4377-9d48-67b3d00ebc81';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '376-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '80050d1a-df3c-4c18-943b-20948ee1cae1';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '979-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = '45051803-4c43-4b5a-b1f3-b49c81fa8e56';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2511-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'fa6e6635-77c6-4882-86a1-a8b721395d35';
UPDATE contracts SET parent_contract_id = (SELECT id FROM contracts WHERE contract_number = '2511-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1) WHERE id = 'e7d79a6b-2dea-4ed7-8147-64859db804a4';

INSERT INTO interadmin_contract_details (id, contract_id, secretaria, admin_fee_initial, admin_fee_additions, mandate_pool_initial, mandate_pool_additions, pending_collection)
VALUES
  ('99958545-44a5-49d7-ab94-f02247456948', '610705d3-6961-4ebd-a4f6-9809068dedb7', 'Secretaria de Educación', 315250625.59, 60912969.73, 3784521316.0, 731248136.0, 0.0),
  ('9bd53232-abc9-4c4f-a987-b790233058cb', '52028d41-40b3-4359-b3dd-35454cb46794', 'Secretaria de Infraestructura', 26771546.0, 6256829.37, 321387109.0, 75111997.35, 0.0),
  ('2e753dcd-ff9c-403f-aea5-830c61fc0003', '0b15b054-8b37-4763-9a2b-804b776c51b0', 'Secretaria de Infraestructura', 49271286.0, 5442822.0, 591492030.0, 65340000.0, 0.0),
  ('a3efbd66-bfba-4ad2-8361-5d3edee82894', '3644b3af-8970-4691-90ab-7b91cd5e8321', 'Secretaria de Infraestructura', 673132645.73, 233180860.4, 8080824078.0, 2813013257.0, 0.0),
  ('576b055c-13d9-4afa-97a8-e08f92731e1a', '4b96c002-bbde-40fd-a83f-742fece21450', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('cafdb6ce-3553-4e30-a4c3-0bc11fe37dd1', '60637d23-087e-406d-8aa7-95591bb87372', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('1d515ffa-eec6-4d32-8370-45f5aaf77798', '53887385-3b03-44d3-a2a1-dd5151a46cfa', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('97a4a6ab-7239-40fa-8faa-2fe954a0a3b5', '6943d29c-7fc1-47a8-9d04-2e1eade2eea3', 'Secretaria de Gobierno', 1542695067.57, 778328381.31, 22038500965.0, 10792700883.0, 0.0),
  ('3da11db8-9c28-45ff-a05a-bbf623684a68', 'f3d96341-c218-49da-9321-8abb608bebea', 'Secretaria General', 0.0, 0.0, 1000000000.0, 0.0, 0.0),
  ('4cf3257b-e4c3-488f-a08c-620972a9bc94', 'd5500b53-2ea2-446c-b36f-eb5e8e1a89b1', 'Secretaria de Infraestructura', 375397105.96, 187642787.0, 4731896294.0, 2365245219.0, 0.0),
  ('9cf995a9-8f94-4e4f-b891-2ac934645d0d', 'ad00cc13-0687-4e21-a691-4c8eafa603fd', 'Secretaria general', 554911685.2, 0.0, 6661604865.0, 0.0, 0.0),
  ('0b398460-a905-4f45-b051-5948a2e6f4d8', 'ec61779e-d1a4-45a4-b58c-004ea3c4b2de', 'Secretaria general', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('c4cfe79e-360a-4f44-8915-8ee8e831bce9', 'ed884424-999c-485c-b0fe-7c7c91dec273', 'Secretaria de Cultura y turismo', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('a595de4e-89fa-49b5-8b64-e41b53ae9ae3', 'c301e428-df8a-402a-a714-1344dd682f13', 'Secretaria de Educación', 111551533.94, 17610230.28, 1731054055.0, 234449792.3, 0.0),
  ('d7e8794a-1385-4f2c-be6d-8d3647c20cfb', 'de9f301f-107a-48fd-950f-4beda16f7ee8', 'Secretaria de Infraestructura', 182549972.04, 57417425.9, 2191476255.0, 820248941.4, 0.0),
  ('4eab30d0-db9c-40cc-af6b-0d11daea5e0b', '79b3cba4-5547-4aae-bd6a-5926264d1965', 'Secretaria de Infraestructura', 152771822.0, 8728904.1, 1833995464.0, 104788764.7, 0.0),
  ('19349e7f-eb95-46a3-814f-2cf656f3265e', '03ecfa58-f119-4ee1-bfea-417b83def53e', 'Secretaria de Movilidad', 60000000.0, 0.0, 439990600.0, 0.0, 0.0),
  ('9bff8a1d-bb09-48b2-9d24-7bfba52ed147', '03b5db74-d472-40a2-aa93-187368b76667', 'Secretaria de Infraestructura', 1316587963.09, 135358248.37, 1316587936.09, 135358248.37, 0.0),
  ('f3baaaaa-f9be-4d39-9f23-4fd01e1f067e', '5fa7fb9c-8c0c-417a-9d63-1c623ec60b79', 'Secretaria de Infraestructura', 1129819040.19, 0.0, 13563253784.0, 0.0, 0.0),
  ('7e501f1a-376b-42ec-898f-46f4ad003eac', '8c62974d-e48b-4f2a-bc40-28d5508c088c', 'Secretaria de Infraestructura', 2010021613.0, 192684145.06, 13278477692.0, 3201896570.0, 0.0),
  ('f4407a5f-4ed8-4d98-be6e-d0a29bd1a9b7', '6e14f557-443d-4702-81c4-5ecf3d2b6ad7', 'Secretaria de Cultura y turismo', 55746826.49, 0.0, 506191057.7, 0.0, 0.0),
  ('1cecfea5-83d6-45a2-94fa-f3efdf5f448d', '7619088f-d094-4230-8a92-48f81fb2b6fb', 'Secretaria de Cultura y turismo', 360000000.0, 0.0, 2640000000.0, 0.0, 0.0),
  ('c7e4b2b3-1768-4a0f-8001-2e4218b57197', '85c5e506-dfaa-4d79-a936-7241fe692e57', 'Secretaria de Cultura y turismo', 369438968.13, 0.0, 3267925415.0, 0.0, 0.0),
  ('8b0d351a-16b4-43de-9948-61876e9e3fef', '6d7467fc-ca1b-4834-b790-1ac2df36daa9', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('d186c126-ea9a-432d-88ba-ec318bf0cfb4', '7fa90a83-4948-4add-85fd-f043685a4afc', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('8222d409-d361-433b-b524-a916446a7b23', 'bda22f22-c084-48c9-9bc6-5657a144842b', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('3e9789ce-29bf-4171-8a82-f89de556a615', 'b7426633-01aa-46d6-9dd9-c277fbbcec14', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('e11acd4b-100f-410a-900b-9edd1ddf186e', '8ac13540-555b-47a2-91a7-7bd620eab495', 'Secretaria de Educación', 35507576.0, 0.0, 1183585851.0, 0.0, 0.0),
  ('ff8d8dc2-8b1e-43a7-8563-e56a9f543284', '68bf3947-b0f8-4a44-918f-aefec0cec043', 'Secretaria de Cultura y turismo', 23324621.98, 0.0, 326675378.0, 0.0, 0.0),
  ('e7d88d93-b3ab-4b78-99c7-79c98968dc29', '4e7a9dc3-990a-46e8-ae62-d758a975d38c', 'Secretaria General', 46649243.98, 0.0, 653350756.0, 30000000.0, 0.0),
  ('f721ae68-09f8-4a11-a198-1353a981a666', '2a865b19-6779-4bc1-9865-8d3b0f76adb5', 'Secretaria de planeación', 6497600.0, 0.0, 78002400.0, 0.0, 0.0),
  ('76b7a455-d44d-4f83-a178-df685253b84c', 'bfbac412-2206-41e6-98fd-9b779f2f5110', 'Alcladia Municipal de Girardot Instituto Municipal de Turismo Cultura y Fomento de Girardot', 21086560.0, 0.0, 421731194.0, 0.0, 0.0),
  ('d4a32cd5-a645-40e3-8f10-320d71be6786', 'fa66e743-1f35-4422-9178-c26ab0ad40ef', 'Secretaria de Educación', 17685774.94, 0.0, 212314225.1, 0.0, 0.0),
  ('de0af7d0-ad3a-4281-bdee-3f3c98a76ddf', 'fd350019-dc56-42ec-805f-570805cc9028', 'Secretaria de Ambiente', 19626168.0, 6757009.35, 280373832.0, 41442990.65, 0.0),
  ('3ea38159-a532-4d8e-a452-63757d90b6c0', 'd3cc243a-669d-4906-bfb2-48be294d9aad', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 19223668.0, 0.0, 230776332.0, 0.0, 0.0),
  ('58e046a8-1e2e-4c15-9981-5bdc9430ae56', '696f6204-c371-44e1-82f8-d72ed167afd9', 'Secretaria de Gobierno', 5978859.0, 1428571.0, 100506167.0, 28571429.0, 0.0),
  ('fb149250-320f-4b8d-b6bc-4f080ba46153', '7f6af928-04be-4f75-9166-b0bf6ecc96a3', 'Secretaria de Infraestructura', 230684021.05, 0.0, 2769315979.0, 0.0, 0.0),
  ('93fc54ec-8556-4371-af99-e8dbadc320c3', '3beec6c3-3424-44c5-b2a6-eec9a7c99c19', 'Secretaria General', 0.0, 0.0, 0.0, 0.0, 0.0),
  ('b0d8f8cb-558e-4b38-98a1-0a0d4588bf07', '677642f8-98b1-4e54-97ef-1464d72eec50', 'Secretaria de Infraestructura', 3557094768.0, 0.0, 142283790.0, 0.0, 0.0),
  ('cf70792d-c6a2-4681-94b7-61698b2d8d65', '2dc7e72b-6904-4ebe-a0b0-73161efbc042', 'Secretaria de infraestructura', 8005850000.0, 0.0, 640468000.0, 0.0, 0.0),
  ('57dee075-3f79-4cca-95c3-960547e308cd', 'a72dcf99-eef6-40b3-a1d9-369ce951e291', 'Secretaria de Cultura', 3502790823.36, 498824775.0, 269329382.7, 38354607.71, 0.0),
  ('ef5880b3-0eac-4861-89af-81b1959edab9', 'b1768c50-dea5-4502-9c96-2962e3070224', 'ALCALDIA MUNICIPAL DE SAN BERNARDO CUNDINAMARCA', 319544072.0, 0.0, 26618021.0, 0.0, 0.0),
  ('068ce07f-ad10-43a9-8dde-909a8d629b89', 'f7b8a725-09cb-4af3-942f-58670b9b0008', 'Secretaria de desarrollo Social', 78221760.0, 0.0, 5585037.0, 0.0, 0.0),
  ('783052ba-3a6f-4e23-86ad-37fd6cb5b73e', 'eb540808-2fe5-491b-9cc0-2c92391910da', 'Secretaria de Gobierno', 356437542.0, 0.0, 25449640.0, 0.0, 0.0),
  ('ce8ae131-7ee7-4602-8d4c-6e455c22a0e5', '874c75d0-462b-486b-9eac-3416f3bf3508', 'Alcladia Municipal de Girardot', 1262058944.0, 0.0, 82541221.0, 0.0, 0.0),
  ('dd314a76-7852-4139-9683-140cf053334e', 'a6e63681-e534-4965-9b32-6ea19dcb81b6', 'Secretaria de infraestructura', 278200000.0, 0.0, 3477500000.0, 0.0, 0.0),
  ('7f7afc5c-ccb1-481a-bdca-1360665a1516', '095addba-3bd0-4e25-82c2-f74d7291d343', 'SECRETARIA DE CULTURA Y TURISMO MARIO ALBERTO FONSECA DIAZ', 1392900000.0, 0.0, 107100000.0, 430756000.0, 0.0),
  ('fc4571b0-c100-44dc-8e12-be67d514da38', '0bc67ff3-5912-44ac-8b66-6d2f8c58d033', 'Alcaldia de Girardot', 356036200.0, 0.0, 24922534.0, 41629634.0, 0.0),
  ('766a7118-b58d-4d3d-b153-6ce34e4697f3', '1385e4c9-a212-4d8d-86d3-5eb93d054386', 'Secretaria de planeación', 9132075472.0, 0.0, 547924528.0, 0.0, 0.0),
  ('24f9aec5-9ac5-4366-a9e8-11a60f8e6d8c', '6cee09d2-20e5-4643-9878-48d696fb6bd9', 'Secretaria de infraestructura', 3738317757.0, 32700000.0, 261682243.0, 467300000.0, 0.0),
  ('f0e66b97-2271-41f8-a799-b3d7d3c70cfe', '10e8642c-39d8-4462-a15d-9f83fce9554b', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 282000000.0, 0.0, 18000000.0, 0.0, 0.0),
  ('8be50283-788f-458c-b296-c29cd5b7fbd9', '82976e02-c08a-4a08-98e5-906cf37928ad', 'Secretaria de infraestructura', 508585108.51, 0.0, 7265501550.0, 0.0, 0.0),
  ('1e9307a1-b6df-42de-ad33-3e5d27149473', '7c72874c-7228-4c51-b2b2-647521582e16', 'Alcaldia de Soacha', 125223897.7, 0.0, 1753836102.0, 0.0, 0.0),
  ('915ca7e2-9a4f-466f-8956-89463cf2a267', 'eabb640c-e8c6-4258-a352-a79e4ef97bbe', 'Secretaria de Ambiente', 33935432.0, 0.0, 449192901.0, 0.0, 0.0),
  ('d57d03e5-c956-466f-b2f9-6d7eb9b3ebca', '14ec9bce-1360-42c3-a187-2f9acd5dd65b', 'Secretaria de infraestructura', 566037736.0, 0.0, 9433962264.0, 0.0, 0.0),
  ('ba95a684-8b62-4989-ad75-243a25c1c8a0', '5228d981-c0f5-44ec-8718-ab0f11cf80f2', 'Secretaria de Cultura y turismo', 35000000000.0, 0.0, 2100000000.0, 0.0, 0.0),
  ('a1209804-6210-42b3-8787-44dd9d5edb2a', '717b5e14-9b18-426f-b344-c22def0a7d5d', 'Secretaria de infraestructura', 1421100000.0, 0.0, 23685000000.0, 0.0, 0.0),
  ('c6fc596b-47fa-45a5-9f1d-c78bb4d76be5', 'a4d81fe8-5544-4bd8-9bec-b3d2a033cb7b', 'Secretaria de desarrollo Social', 480000000.0, 0.0, 8000000000.0, 0.0, 0.0),
  ('82bd5824-a953-43f5-9290-3a4977947e3e', '4a6a6411-6bab-4d3e-befe-4d834bcc68e9', 'Instituto Municipal para la Recreación y el Deporte de Soacha', 600000000.0, 0.0, 10000000000.0, 0.0, 0.0),
  ('7a4009dd-fea7-4505-b7dc-a8d7f2f6d326', 'bc836e0e-74e9-44db-906f-c62a0588f894', 'Secretaria de infraestructura', 180000000.0, 187680000.0, 4500000000.0, 12000000.0, 0.0),
  ('72dd3b69-c907-42d5-871e-6a668d309a4e', '384fac10-c05d-4bb0-b76b-1f869adaec6c', 'Secretaria de Gobierno', 10199972.0, 0.0, 169999538.0, 0.0, 0.0),
  ('9dd6fb2b-4636-4d9d-a58f-b34d6694129f', '3ebdfe12-d5c6-4340-aa8e-3bed341ad722', 'Secretaria de infraestructura', 672545527.0, 0.0, 11209092136.0, 0.0, 0.0),
  ('2f8f7c58-036d-40da-a99d-a6a4bbad8dd6', 'abe9d012-efd7-4d9e-a70a-d18d70440a60', 'Secretaria de Gobierno', 176916792.0, 0.0, 2771696401.0, 0.0, 0.0),
  ('43e1629a-d994-4f4e-9eef-1efb59bd0261', '3c7cc134-79d2-4afd-ab60-237e8bc46780', 'Secretaria de infraestructura', 20700000.0, 0.0, 345000000.0, 0.0, 0.0),
  ('6ea73fd7-b86c-4810-9ff4-67dacf18ffd3', '949d4983-78ab-4402-a548-c48aed0a6c38', 'Alcaldia de Girardot', 162840463.86, 0.0, 2624998576.0, 0.0, 0.0)
ON CONFLICT (contract_id) DO NOTHING;

INSERT INTO invoice_payment_details (id, contract_id, committee_number, committee_act_info, invoice_date, requesting_officer)
VALUES
  ('fd47830d-f21d-4a75-b6df-cdbec159500e', '651eb248-30f4-4914-a7f1-d587ac3de45d', NULL, NULL, '2024-01-24', NULL),
  ('8b6c9c02-4b82-4c8e-a87f-93791623ec3f', '19cb2acb-d94b-48ff-a51c-eb189981c376', NULL, NULL, '2024-04-29', NULL),
  ('f490fe31-292c-4f38-9708-21d58da19b91', 'ba137795-882e-4c7b-8327-dc1f8877a15c', NULL, NULL, '2024-05-28', NULL),
  ('ca545ddd-41ce-4721-a172-ee7bc747945e', '626f8951-176c-4849-96a6-a7ac55cd98c7', NULL, NULL, '2024-05-10', NULL),
  ('ab821e4e-cea7-4ee7-ab04-3c295cc09e1e', '0fad61d1-c278-45fe-9f6e-40236f0538d4', NULL, NULL, '2024-05-17', NULL),
  ('9d94db77-ca94-4e80-b302-325488383363', '680cb477-5f75-4702-9a1a-2fbdda72b36f', NULL, NULL, '2024-05-28', NULL),
  ('ebcc7dfa-0d68-4d18-8266-fcadeac3b5d4', 'd5ab438c-0302-413c-8f88-9ef8640e343c', NULL, NULL, '2024-05-29', NULL),
  ('0bc77c35-fcc6-48f5-a5d9-23df700dd61f', '2431ab36-7848-4139-8253-40ce10698fd2', NULL, NULL, '2024-07-12', NULL),
  ('0112dfbe-4c5f-4eaa-918e-62fe969c788e', 'b7f9bdf8-a7da-4cac-a088-124672781fef', NULL, NULL, '2024-07-12', NULL),
  ('97ffc34e-0664-495d-89c9-3399f61d1998', '7ca4e3d9-087a-4b34-9106-1d6bf6c822eb', NULL, NULL, '2024-12-31', NULL),
  ('2f19e4dd-c072-49f6-9ca5-a0ec02667250', '96d9c10f-c4c2-463f-a063-5201fce552a3', NULL, NULL, '2024-08-08', NULL),
  ('f0d73b6f-84d6-4f9c-a9d8-dd248af77422', '39c66451-532f-4f8c-be5a-a1e7d693cab1', NULL, NULL, '2024-12-31', NULL),
  ('a8b322c5-c5c0-4e22-b4e6-b4e7719fdd78', '8fcffd94-bff7-435c-a41d-c2568857e573', NULL, NULL, '2024-10-07', NULL),
  ('673b40ea-aff1-410e-b198-f573c5781892', '9f0423c4-71c1-47bf-8d2f-2b34d0084d47', NULL, NULL, '2024-10-07', NULL),
  ('2928feaa-f439-478a-b9c1-76f786440cee', '5ded754c-ebca-4e08-a631-147d09a9a718', NULL, NULL, '2024-10-01', NULL),
  ('f27764a3-94ca-4bec-b81e-8181a84935f5', 'cbc5b186-13d7-4000-9453-813e30c9d37a', NULL, NULL, '2024-09-29', NULL),
  ('5687033b-992f-4724-9f3f-df6f5cea6a94', 'ebacb20b-bc08-4f98-af24-16fb5c490de1', NULL, NULL, '2024-09-29', NULL),
  ('f7b23b08-7561-47ab-bcc5-239108d97ceb', '8107ad5f-5063-44fe-89ad-47da8a7d9444', NULL, NULL, '2024-12-31', NULL),
  ('3283384b-5980-467e-afb6-197be35f2c75', '405c61ee-cfb2-486f-8cc9-b4a2e3a1d8a2', NULL, NULL, '2024-12-31', NULL),
  ('3b62b862-645a-46d4-8e1c-ab0a07dba87b', '80561bc9-bac1-4686-8c59-907edfae199c', NULL, NULL, '2024-12-31', NULL),
  ('36122687-5b02-4409-b1ad-c70b2b838373', '398949c1-9862-4c72-b816-318925a7ede5', NULL, NULL, '2024-12-30', NULL),
  ('799dd3b4-d08f-48a1-bd10-d48b96ba8481', 'd2ba89e8-a168-4fae-9a52-f2f44e24cee6', NULL, NULL, '2024-12-31', NULL),
  ('12e433de-9002-47e1-9bee-bf6f3fc8aadb', 'dc5481a9-2310-4a83-bcc1-d2d210c6b8d3', NULL, NULL, NULL, NULL),
  ('6e020886-09f0-4590-b56e-17d26371077e', '4ef72b05-5d3d-443b-9b13-71725c932464', NULL, NULL, '2024-10-18', NULL),
  ('329aa85e-e867-441a-ae41-c80120a30601', '0b2ef628-7771-4f1f-b5cb-f8ffb5729eb9', NULL, NULL, '2024-12-31', NULL),
  ('8079540f-5aeb-4fe1-bf1a-42d27e130969', 'dc367008-27a7-442b-9596-1bb2892ac454', NULL, NULL, '2024-12-05', NULL),
  ('799c9a72-6df7-4e43-be20-9539abe182a4', 'dcfd9b92-43ee-4c46-9bae-a7c538af3085', NULL, NULL, '2024-12-31', NULL),
  ('2a53d65b-fcd2-46b1-8450-d3fdec0e65f2', '90bbfb61-6def-459e-b583-45ba1ea9b094', NULL, NULL, '2024-12-24', NULL),
  ('5dd3eebc-be7a-4d62-ab2b-8eb6cba5d58a', '03c70df7-76c2-4129-8c85-a24581113af6', NULL, NULL, '2024-12-31', NULL),
  ('2ae19267-6aa7-4674-9089-5b971e2ec85f', '36b4fbaf-efac-4d47-a158-679452ef4149', NULL, NULL, '2024-12-26', NULL),
  ('75561ab2-bee1-4337-9d3f-841ebb472419', '38319cbc-1004-44c5-b865-4c2c16811c90', NULL, NULL, NULL, NULL),
  ('2a7c7707-e4db-4038-99c7-5b082d00c219', '38bb89c8-5c25-4c49-b2cf-dab2da1793a4', NULL, NULL, NULL, NULL),
  ('0768ace5-f758-4706-aa61-484dcce6c216', 'd4ddf91b-e6f4-430f-bd4e-2df9750425f5', '95.0', NULL, '2025-02-28', NULL),
  ('6fd7d112-d825-4156-8ef2-ce23d2208488', '4177a4d0-9a0b-43c8-8d14-33d9fb9caf54', '95.0', NULL, '2025-09-24', NULL),
  ('e2bdf806-872a-4279-896b-631bc5d43490', 'befef48d-39f5-490f-bbeb-97669a281970', '95.0', NULL, '2025-05-02', NULL),
  ('f9e2f525-e649-4ab5-8927-80b82e5d3822', '5ee22fa9-47ab-489b-a6c3-838e28f61538', '98.0', NULL, '2025-03-19', NULL),
  ('cd7b9e66-24ed-43b0-9de6-e83e78c78ad5', '987df3e6-f37b-480b-bbe7-dbbd24bad441', '98.0', NULL, '2025-03-20', NULL),
  ('ee7491e7-b9f6-4a49-a57e-37b55bc65e1b', 'c6a2a013-38cf-46fa-9948-fd4ab937aec0', NULL, NULL, '2024-11-29', NULL),
  ('d621b0a8-9455-40ba-aa1c-9e7b0e058708', '75782cc5-c534-42eb-8fb0-86c928919240', '100.0', NULL, '2025-03-31', NULL),
  ('2412487b-fd8e-4e50-9f3d-e91668d734cd', '8276a071-3e71-4079-bf69-8f873cc63a2e', '96.0', NULL, '2025-03-03', NULL),
  ('53c8b578-1465-46d7-8c03-4abea196a13d', '166f69f4-581b-4b7b-ab49-72730416bf37', '100.0', NULL, NULL, NULL),
  ('ff8767aa-822c-4133-89a3-75e52f9bcac3', '6c13255f-d272-4d36-ac26-d0b1917f0355', '100.0', NULL, NULL, NULL),
  ('35714676-3574-469a-9a41-ec656eebb48f', '25f9871a-afdc-4d61-9916-93a7394a2af1', '102.0', NULL, NULL, NULL),
  ('d7c6deba-a69d-4703-96fb-af976b1d85c6', 'ee366c60-8960-46a6-a60a-a5d3a21da56e', NULL, NULL, NULL, NULL),
  ('4202e009-3a7a-4225-81a1-54a095a5c1ea', '00a881a4-3aad-4a6a-ba29-e10e106101b8', NULL, NULL, '2025-05-30', NULL),
  ('4fafd8bd-b97e-4eff-b8c7-d5de2e7943c4', '7189efae-ce40-4ea8-a527-6c60dd469ced', '103.0', NULL, '2025-05-29', NULL),
  ('290be7a1-6435-44d1-a276-2e13b0ece114', '3dc78764-3310-4536-b557-b7673bafc1f1', '104.0', NULL, '2025-05-30', NULL),
  ('3fa068c5-73a0-4df5-8a0c-69d357c1a4c1', 'e822a4b6-ec19-4db6-a89a-a254af4115ba', NULL, NULL, '2025-09-01', NULL),
  ('b8a8a672-73ee-43e5-b146-9126fc33b2c1', 'c111b8b0-af0b-49ec-96cb-c367cadbd13f', NULL, NULL, '2025-07-10', NULL),
  ('0cf58daa-4c85-493d-990f-4c6e99742e5b', '404f7212-5e8b-4f8c-845e-27ceca657d06', '107.0', NULL, '2025-11-06', NULL),
  ('77d89ae9-0ca2-4823-9795-570c71cb789a', '34069d9b-d166-44f3-ab69-a1a6ba0868d4', '110.0', NULL, '2025-08-22', NULL),
  ('42f6e736-246f-4be6-a0ec-2698f4d1b567', '66789508-7417-4c0d-b8cd-bbbda176a3fd', '112.0', NULL, '2025-09-01', NULL),
  ('d6235dae-542e-493b-ad76-294abe37ddd0', 'd24943d3-0db7-41bf-9b7d-455b35c6e310', '113.0', NULL, '2025-09-12', NULL),
  ('af1fe0d9-998b-4735-a9c2-fd1891dd89a8', '23c1173b-6614-4cad-af92-70409bdeb7b8', '114.0', NULL, '2025-09-18', NULL),
  ('82773a5e-8ec6-46cc-b512-7e9eba7f3853', '38b1df59-e2bf-4d6d-93bf-9e238e19ed69', '115.0', NULL, '2025-09-26', NULL),
  ('05595ada-ef38-4e23-8e91-3379c48fe3f0', 'db6f2f20-2a21-4c26-89da-edc205febd57', '112.0', NULL, NULL, NULL),
  ('a6a337df-c2fd-41f5-9261-11edd26d060d', '212336a5-f6e3-44ba-a082-2fb3366dd6b1', NULL, NULL, '2025-09-24', NULL),
  ('13028555-ec52-41e0-8d7e-1e1076472ef9', '7e53e23c-c3ae-48df-8d99-63edd4182ffa', NULL, NULL, '2025-10-16', NULL),
  ('a0ab574f-aec0-4385-84e4-1056458b03c9', 'ab9a03be-0c12-4c2f-8774-2c6a90c608cb', NULL, NULL, '2025-10-16', NULL),
  ('86ce7ff8-b78f-4aba-829e-b5eb2ce0d19b', '12020d28-83e7-4611-b216-b5e92e8caabb', NULL, NULL, '2025-10-30', NULL),
  ('73b9ac94-fe69-4ad0-abac-6d97f52fb9b0', '32d00ec2-cbc6-4112-a9f2-1e832db89c60', NULL, NULL, '2025-11-04', NULL),
  ('b45f0ed1-da8e-480f-a80d-e5273aaa8e7a', '7db6b4fd-ccd8-4b37-9ce8-8f286ced5b18', NULL, NULL, '2025-11-06', 'MAYRA RINCON'),
  ('626d47ba-87df-4432-ad2c-acdb9c8582d8', '0020a3e0-4db4-4882-a767-4282e7216ecc', NULL, NULL, '2025-11-12', 'MAYRA RINCON'),
  ('11bb0de8-a23b-46d6-bc7f-1e3588a7a456', '5b09ab4a-4d79-4ce5-b21f-8c6c135d2444', NULL, NULL, NULL, NULL),
  ('f2d6bbb4-05d0-418e-a174-47420740093b', 'a7ad7d47-3182-4add-8871-cc1a859ef939', NULL, NULL, '2025-11-18', 'MAYRA RINCON'),
  ('d91f1da0-768a-4725-8f45-e76bb1bd80f0', 'c1e72e8c-0498-4013-a88a-39da71e31721', NULL, NULL, '2025-11-19', 'MAYRA RINCON'),
  ('749f81d6-0306-47e8-b9a5-b8fec0e355aa', '2e4571fe-3d0f-4601-9dde-dc8a9d07fa55', NULL, NULL, '2025-11-19', 'MAURICIO CORREA'),
  ('5a3731fd-78df-4b10-8231-79103b3f5ccb', '59375032-f1f4-4958-8702-93414b31e615', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('e9c5b32d-50a2-470b-aae4-43ce02a0b600', '66a58887-882c-4d91-b16b-4e26092fd6c5', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('cb7f48fb-18ed-4f74-9d46-9bb97b9d5058', 'f5150ec3-2e51-4ae0-98c3-025015e7b6ef', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('ab9996bd-722e-44b2-af73-95172f774338', '3aeddbf4-c585-46de-870e-a6f0e462a943', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('d7fde664-cac2-4c25-90d4-b5286ac6ffbc', 'd6d1923f-53e5-4f0e-bb06-977896fc88f9', NULL, NULL, NULL, 'SEBASTIAN OBANDO'),
  ('6e6c57d8-7c0c-4a05-88d9-72d25176f13d', 'ed5bac9d-bfac-4fe6-aecd-8c10e2cabca5', NULL, NULL, NULL, 'YUDILMA PALOMINO'),
  ('01ab8491-9d90-43ff-9a83-3bc3663a1d3a', 'c21fbab2-04ab-43ea-b9bf-da9a32f988d2', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('44ee2e34-4751-402b-bfc8-b94cea0ee35a', '2e943874-70de-482f-8872-0d26da0fd1f6', NULL, NULL, NULL, 'MAYRA RINCON'),
  ('7e343597-caca-4089-a781-2b0c768e8a7d', '70eff550-57b6-4490-9606-199061b6408d', NULL, NULL, NULL, 'SEBASTIAN OBANDO')
ON CONFLICT (contract_id) DO NOTHING;

SELECT COUNT(*) AS parent_refs FROM contracts WHERE parent_contract_id IS NOT NULL;

COMMIT;
