-- Example data. Run only on an empty database (npm run db:reset:local).
INSERT INTO campaigns (id,name,system,status,description,schedule_note,is_paid,default_session_price_cents) VALUES
 (1,'Curse of the Ember Crown','D&D 5e','active','A gothic heist-turned-war story. Levels 3 to 8.','Mondays 19:00, fortnightly-ish',1,1500);

INSERT INTO players (id,name,contact,notes) VALUES
 (1,'Aoife','aoife@example.com','Prefers bank transfer'),
 (2,'Cian','086 000 0000','Always brings snacks'),
 (3,'Niamh','niamh@example.com','Prepaid a block of sessions');

INSERT INTO characters (id,player_id,campaign_id,name,class,level,dndbeyond_url,status) VALUES
 (1,1,1,'Seraphine Vale','Wizard',4,'https://www.dndbeyond.com/characters/000001','active'),
 (2,2,1,'Brannoch the Stout','Fighter',4,'https://www.dndbeyond.com/characters/000002','active'),
 (3,3,1,'Pip Underbough','Rogue',4,'https://www.dndbeyond.com/characters/000003','active');

INSERT INTO sessions (id,campaign_id,number,title,starts_at,status,price_cents,prep_notes,recap) VALUES
 (1,1,1,'The Ashen Gate','2026-10-12T19:00','played',1500,'Intro at the gate. Introduce Warden Holt.','The party met at the **Ashen Gate** and agreed to find the missing crown.

- Seraphine found a sealed letter
- Brannoch picked a fight with the guards'),
 (2,1,2,'Smoke in the Archives','2026-10-19T19:00','played',1500,'Archive puzzle; fire hazard.','Pip nearly burned the archive down. Clue: *the crown was never stolen*.'),
 (3,1,3,'Ember Market','2026-10-26T19:00','played',1500,'Market encounter; the masked broker.','The party chased the broker through the market and lost him at the docks.'),
 (4,1,4,'The Hollow Cathedral','2026-11-09T19:00','planned',1500,'Cathedral crypt, three doors, one trap.',''),
 (5,1,5,'Crown of Cinders','2026-11-23T19:00','planned',1500,'','');

INSERT INTO session_attendees (session_id,player_id,character_id,attended,charge_cents) VALUES
 (1,1,1,1,1500),(1,2,2,1,1500),(1,3,3,1,1500),
 (2,1,1,1,1500),(2,2,2,1,1500),(2,3,3,0,0),
 (3,1,1,1,1500),(3,2,2,1,1500),(3,3,3,1,1500),
 (4,1,1,0,0),(4,2,2,0,0),(4,3,3,0,0);

-- Aoife: charged 45.00, paid 45.00 (balance 0). Cian: charged 45.00, paid 30.00 (owes 15.00).
-- Niamh: charged 30.00, prepaid 50.00 (credit 20.00).
INSERT INTO payments (player_id,campaign_id,session_id,amount_cents,currency,method,paid_on,note) VALUES
 (1,1,NULL,4500,'EUR','bank','2026-10-12','Paid for first three sessions'),
 (2,1,1,1500,'EUR','cash','2026-10-12',''),
 (2,1,2,1500,'EUR','cash','2026-10-19',''),
 (3,1,NULL,5000,'EUR','revolut','2026-10-10','Prepaid block');
