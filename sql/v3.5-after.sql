BEGIN;

DROP INDEX list_member_code ON list_member;
DROP TABLE list_member;
ALTER TABLE list DROP COLUMN code;
ALTER TABLE request DROP COLUMN code;
ALTER TABLE question DROP COLUMN code;

COMMIT;
