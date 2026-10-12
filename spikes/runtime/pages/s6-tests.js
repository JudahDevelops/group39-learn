// S6 assertions, shared by the main-thread and Web Worker variants. `db` is a PGlite or PGliteWorker.
import { SCHEMA_SQL, SAMPLE_SQL } from "./s6-schema.js";

async function rejects(db, sql) {
  try {
    await db.exec(sql);
    return { rejected: false };
  } catch (err) {
    return { rejected: true, message: String((err && err.message) || err), constraint: err && err.constraint, code: err && err.code };
  }
}

export async function loadAppendixD(db) {
  await db.exec(SCHEMA_SQL); // Appendix D, verbatim
  await db.exec(SAMPLE_SQL); // Lesson 13.3 sample data, verbatim
}

export async function runDbChecks(db, c) {
  const tables = await db.query(`select count(*)::int as n from information_schema.tables where table_schema = 'public'`);
  c.check("Appendix D schema creates all 7 tables", tables.rows[0].n === 7, tables.rows[0]);

  const counts = await db.query(`select (select count(*)::int from hostels) h, (select count(*)::int from rooms) r, (select count(*)::int from bed_spaces) b`);
  c.check("sample data inserts 2 hostels, 4 rooms, 8 bed spaces", JSON.stringify(counts.rows[0]) === '{"h":2,"r":4,"b":8}', counts.rows[0]);

  await db.exec(`
    INSERT INTO users (full_name, email, password_hash, role, gender, level, fees_cleared) VALUES
      ('Amaka Okafor', 'amaka@example.com', 'hash1', 'student', 'female', 100, true),
      ('Bisi Adeyemi', 'bisi@example.com', 'hash2', 'student', 'female', 100, true),
      ('Chidi Eze',    'chidi@example.com', 'hash3', 'student', 'male',   100, true);
  `);
  await db.exec(`INSERT INTO allocations (student_id, bed_space_id) VALUES (1, 1);`);
  const active = await db.query(`select status from allocations where student_id = 1 and bed_space_id = 1`);
  c.check("first active allocation for bed 1 is accepted (status defaults to active)", active.rows.length === 1 && active.rows[0].status === "active", active.rows);

  const dupBed = await rejects(db, `INSERT INTO allocations (student_id, bed_space_id, status) VALUES (2, 1, 'active');`);
  c.check("one_active_allocation_per_bed rejects a second active allocation for the same bed",
    dupBed.rejected && /one_active_allocation_per_bed/.test(dupBed.message), dupBed);

  const dupStudent = await rejects(db, `INSERT INTO allocations (student_id, bed_space_id, status) VALUES (1, 2, 'active');`);
  c.check("one_active_allocation_per_student rejects a second active bed for the same student",
    dupStudent.rejected && /one_active_allocation_per_student/.test(dupStudent.message), dupStudent);

  const endedOk = await rejects(db, `INSERT INTO allocations (student_id, bed_space_id, status) VALUES (2, 1, 'ended');`);
  c.check("a non-active (ended) row for the same bed is allowed (partial index)", endedOk.rejected === false, endedOk);

  const otherBed = await rejects(db, `INSERT INTO allocations (student_id, bed_space_id, status) VALUES (2, 2, 'active');`);
  c.check("an active allocation for a different bed is allowed", otherBed.rejected === false, otherBed);

  const badGender = await rejects(db, `INSERT INTO hostels (name, gender, level) VALUES ('Block C', 'unknown', 100);`);
  c.check("CHECK constraint on hostels.gender rejects 'unknown'", badGender.rejected && /check constraint/i.test(badGender.message), badGender);

  const join = await db.query(`
    SELECT u.full_name, h.name AS hostel, r.number AS room, bs.label AS bed
    FROM allocations a
    JOIN users u ON u.id = a.student_id
    JOIN bed_spaces bs ON bs.id = a.bed_space_id
    JOIN rooms r ON r.id = bs.room_id
    JOIN hostels h ON h.id = r.hostel_id
    WHERE a.status = 'active'
    ORDER BY u.full_name;`);
  const expected = [
    { full_name: "Amaka Okafor", hostel: "Block A", room: "A-101", bed: "1" },
    { full_name: "Bisi Adeyemi", hostel: "Block A", room: "A-101", bed: "2" },
  ];
  c.check("4-table JOIN returns the two active allocations", JSON.stringify(join.rows) === JSON.stringify(expected), join.rows);

  const version = await db.query(`select version() as v`);
  return { postgres: version.rows[0].v, dupBedMessage: dupBed.message };
}
