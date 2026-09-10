import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.VITE_DATABASE_URL || "postgresql://neondb_owner:npg_4xTuzRpw9tmY@ep-lucky-feather-b3y9zm31-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(connectionString);

function sqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function setup() {
  console.log("Connecting to Neon DB...");
  const version = await sql`SELECT version()`;
  console.log("Connected successfully! Version:", version[0].version);

  console.log("Creating tables in Neon DB...");

  // Drop existing tables
  await sql`DROP TABLE IF EXISTS activity_logs CASCADE`;
  await sql`DROP TABLE IF EXISTS status_history CASCADE`;
  await sql`DROP TABLE IF EXISTS communication_history CASCADE`;
  await sql`DROP TABLE IF EXISTS follow_ups CASCADE`;
  await sql`DROP TABLE IF EXISTS candidates CASCADE`;
  await sql`DROP TABLE IF EXISTS recruiter_leads CASCADE`;
  await sql`DROP TABLE IF EXISTS system_settings CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  // 1. Users
  await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) DEFAULT '',
      role VARCHAR(20) DEFAULT 'STAFF',
      phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 2. Recruiter Leads
  await sql`
    CREATE TABLE recruiter_leads (
      id SERIAL PRIMARY KEY,
      lead_id VARCHAR(30) UNIQUE NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      recruiter_name VARCHAR(150),
      designation VARCHAR(100),
      mobile VARCHAR(50),
      alternate_mobile VARCHAR(50),
      email VARCHAR(150),
      website VARCHAR(255),
      address TEXT,
      district VARCHAR(100),
      taluk VARCHAR(100),
      state VARCHAR(100) DEFAULT 'Tamil Nadu',
      industry VARCHAR(100),
      job_role VARCHAR(255),
      job_description TEXT,
      candidates_required INT DEFAULT 0,
      salary_range VARCHAR(100),
      qualification VARCHAR(255),
      experience_required VARCHAR(100),
      job_location VARCHAR(150),
      lead_source VARCHAR(100),
      sourced_by INT REFERENCES users(id) ON DELETE SET NULL,
      assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'YET_TO_CONNECT',
      first_contact_date DATE,
      last_contacted_date TIMESTAMP,
      next_follow_up_date DATE,
      remarks TEXT,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 3. Candidates
  await sql`
    CREATE TABLE candidates (
      id SERIAL PRIMARY KEY,
      candidate_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      contact_number VARCHAR(100) NOT NULL,
      alternate_mobile VARCHAR(100),
      email VARCHAR(255),
      location VARCHAR(255),
      state VARCHAR(255) DEFAULT 'Tamil Nadu',
      educational_qualification VARCHAR(255),
      specialization VARCHAR(255),
      college_name VARCHAR(500),
      year_of_passout VARCHAR(255),
      position_interested_in VARCHAR(255),
      willing_to_relocate VARCHAR(255) DEFAULT 'Yes',
      experience_type VARCHAR(100) DEFAULT 'Fresher',
      total_years_experience VARCHAR(255),
      designation_worked VARCHAR(255),
      current_ctc VARCHAR(255),
      expected_ctc VARCHAR(255),
      status VARCHAR(100) DEFAULT 'NEW',
      remarks TEXT,
      assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 4. Follow Ups
  await sql`
    CREATE TABLE follow_ups (
      id SERIAL PRIMARY KEY,
      recruiter_id INT REFERENCES recruiter_leads(id) ON DELETE CASCADE,
      follow_up_date DATE NOT NULL,
      follow_up_time VARCHAR(20),
      follow_up_type VARCHAR(30) DEFAULT 'Phone Call',
      status VARCHAR(20) DEFAULT 'Pending',
      notes TEXT,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 5. Communication History
  await sql`
    CREATE TABLE communication_history (
      id SERIAL PRIMARY KEY,
      recruiter_id INT REFERENCES recruiter_leads(id) ON DELETE CASCADE,
      communication_type VARCHAR(30) DEFAULT 'Phone',
      communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      summary TEXT,
      next_steps TEXT,
      logged_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 6. Status History
  await sql`
    CREATE TABLE status_history (
      id SERIAL PRIMARY KEY,
      recruiter_id INT REFERENCES recruiter_leads(id) ON DELETE CASCADE,
      old_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      remarks TEXT,
      changed_by INT REFERENCES users(id) ON DELETE SET NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 7. Activity Logs
  await sql`
    CREATE TABLE activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      record_id VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 8. System Settings
  await sql`
    CREATE TABLE system_settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log("All tables created successfully in Neon DB!");

  // Load initialData.json
  const dataPath = path.resolve("src/db/initialData.json");
  const initialData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Seed Users
  console.log(`Seeding ${initialData.users.length} users...`);
  if (initialData.users.length > 0) {
    const userRows = initialData.users.map(u => 
      `(${sqlVal(u.id)}, ${sqlVal(u.name)}, ${sqlVal(u.email)}, ${sqlVal(u.password_hash || '')}, ${sqlVal(u.role || 'STAFF')}, ${sqlVal(u.phone || '')}, ${sqlVal(u.status || 'ACTIVE')}, ${sqlVal(u.created_at || new Date().toISOString())}, ${sqlVal(u.updated_at || new Date().toISOString())})`
    ).join(',\n');
    await sql.query(`INSERT INTO users (id, name, email, password_hash, role, phone, status, created_at, updated_at) VALUES ${userRows} ON CONFLICT (id) DO NOTHING;`);
    await sql`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));`;
  }

  // Seed Settings
  console.log(`Seeding ${initialData.settings.length} settings...`);
  if (initialData.settings.length > 0) {
    const settingRows = initialData.settings.map(s =>
      `(${sqlVal(s.id)}, ${sqlVal(s.key)}, ${sqlVal(s.value)}, ${sqlVal(s.description || '')}, ${sqlVal(s.updated_at || new Date().toISOString())})`
    ).join(',\n');
    await sql.query(`INSERT INTO system_settings (id, key, value, description, updated_at) VALUES ${settingRows} ON CONFLICT (id) DO NOTHING;`);
    await sql`SELECT setval('system_settings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM system_settings));`;
  }

  // Seed Recruiters in multi-row batches of 200
  console.log(`Seeding ${initialData.recruiters.length} recruiters in bulk batches...`);
  const chunkSize = 200;
  for (let i = 0; i < initialData.recruiters.length; i += chunkSize) {
    const chunk = initialData.recruiters.slice(i, i + chunkSize);
    const rows = chunk.map(r => 
      `(${sqlVal(r.id)}, ${sqlVal(r.lead_id)}, ${sqlVal(r.company_name)}, ${sqlVal(r.recruiter_name || '')}, ${sqlVal(r.designation || '')}, ${sqlVal(r.mobile || '')}, ${sqlVal(r.alternate_mobile || '')}, ${sqlVal(r.email || '')}, ${sqlVal(r.website || '')}, ${sqlVal(r.address || '')}, ${sqlVal(r.district || '')}, ${sqlVal(r.taluk || '')}, ${sqlVal(r.state || 'Tamil Nadu')}, ${sqlVal(r.industry || 'College')}, ${sqlVal(r.job_role || '')}, ${sqlVal(r.job_description || '')}, ${sqlVal(Number(r.candidates_required) || 0)}, ${sqlVal(r.salary_range || '')}, ${sqlVal(r.qualification || '')}, ${sqlVal(r.experience_required || '')}, ${sqlVal(r.job_location || '')}, ${sqlVal(r.lead_source || '')}, ${sqlVal(r.sourced_by || null)}, ${sqlVal(r.assigned_to || null)}, ${sqlVal(r.status || 'YET_TO_CONNECT')}, ${sqlVal(r.first_contact_date || null)}, ${sqlVal(r.last_contacted_date || null)}, ${sqlVal(r.next_follow_up_date || null)}, ${sqlVal(r.remarks || '')}, ${sqlVal(r.created_by || null)}, ${sqlVal(r.created_at || new Date().toISOString())}, ${sqlVal(r.updated_at || new Date().toISOString())})`
    ).join(',\n');

    await sql.query(`
      INSERT INTO recruiter_leads (
        id, lead_id, company_name, recruiter_name, designation, mobile, alternate_mobile,
        email, website, address, district, taluk, state, industry, job_role, job_description,
        candidates_required, salary_range, qualification, experience_required, job_location,
        lead_source, sourced_by, assigned_to, status, first_contact_date, last_contacted_date,
        next_follow_up_date, remarks, created_by, created_at, updated_at
      ) VALUES ${rows}
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log(`Migrated ${Math.min(i + chunkSize, initialData.recruiters.length)} / ${initialData.recruiters.length} recruiters...`);
  }
  await sql`SELECT setval('recruiter_leads_id_seq', (SELECT COALESCE(MAX(id), 1) FROM recruiter_leads));`;

  // Seed Candidates in multi-row batches of 200
  console.log(`Seeding ${initialData.candidates.length} candidates in bulk batches...`);
  for (let i = 0; i < initialData.candidates.length; i += chunkSize) {
    const chunk = initialData.candidates.slice(i, i + chunkSize);
    const rows = chunk.map(c =>
      `(${sqlVal(c.id)}, ${sqlVal(c.candidate_id)}, ${sqlVal(c.name)}, ${sqlVal(c.contact_number || '')}, ${sqlVal(c.alternate_mobile || '')}, ${sqlVal(c.email || '')}, ${sqlVal(c.location || '')}, ${sqlVal(c.state || 'Tamil Nadu')}, ${sqlVal(c.educational_qualification || '')}, ${sqlVal(c.specialization || '')}, ${sqlVal(c.college_name || '')}, ${sqlVal(c.year_of_passout || '')}, ${sqlVal(c.position_interested_in || '')}, ${sqlVal(c.willing_to_relocate || 'Yes')}, ${sqlVal(c.experience_type || 'Fresher')}, ${sqlVal(c.total_years_experience || '')}, ${sqlVal(c.designation_worked || '')}, ${sqlVal(c.current_ctc || '')}, ${sqlVal(c.expected_ctc || '')}, ${sqlVal(c.status || 'NEW')}, ${sqlVal(c.remarks || '')}, ${sqlVal(c.assigned_to || null)}, ${sqlVal(c.created_by || null)}, ${sqlVal(c.created_at || new Date().toISOString())}, ${sqlVal(c.updated_at || new Date().toISOString())})`
    ).join(',\n');

    await sql.query(`
      INSERT INTO candidates (
        id, candidate_id, name, contact_number, alternate_mobile, email, location, state,
        educational_qualification, specialization, college_name, year_of_passout,
        position_interested_in, willing_to_relocate, experience_type, total_years_experience,
        designation_worked, current_ctc, expected_ctc, status, remarks, assigned_to,
        created_by, created_at, updated_at
      ) VALUES ${rows}
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log(`Migrated ${Math.min(i + chunkSize, initialData.candidates.length)} / ${initialData.candidates.length} candidates...`);
  }
  await sql`SELECT setval('candidates_id_seq', (SELECT COALESCE(MAX(id), 1) FROM candidates));`;

  // Seed Follow Ups
  if (initialData.follow_ups.length > 0) {
    console.log(`Seeding ${initialData.follow_ups.length} follow-ups...`);
    const followUpRows = initialData.follow_ups.map(f =>
      `(${sqlVal(f.id)}, ${sqlVal(f.recruiter_id)}, ${sqlVal(f.follow_up_date)}, ${sqlVal(f.follow_up_time || '')}, ${sqlVal(f.follow_up_type || 'Phone Call')}, ${sqlVal(f.status || 'Pending')}, ${sqlVal(f.notes || '')}, ${sqlVal(f.created_by || null)}, ${sqlVal(f.created_at || new Date().toISOString())}, ${sqlVal(f.updated_at || new Date().toISOString())})`
    ).join(',\n');
    await sql.query(`INSERT INTO follow_ups (id, recruiter_id, follow_up_date, follow_up_time, follow_up_type, status, notes, created_by, created_at, updated_at) VALUES ${followUpRows} ON CONFLICT (id) DO NOTHING;`);
    await sql`SELECT setval('follow_ups_id_seq', (SELECT COALESCE(MAX(id), 1) FROM follow_ups));`;
  }

  // Seed Activity Logs in batches of 200
  if (initialData.activity_logs.length > 0) {
    console.log(`Seeding ${initialData.activity_logs.length} activity logs in bulk batches...`);
    for (let i = 0; i < initialData.activity_logs.length; i += chunkSize) {
      const chunk = initialData.activity_logs.slice(i, i + chunkSize);
      const rows = chunk.map(a =>
        `(${sqlVal(a.id)}, ${sqlVal(a.user_id || null)}, ${sqlVal(a.action)}, ${sqlVal(a.module)}, ${sqlVal(a.record_id || '')}, ${sqlVal(a.details || '')}, ${sqlVal(a.ip_address || '')}, ${sqlVal(a.created_at || new Date().toISOString())})`
      ).join(',\n');

      await sql.query(`INSERT INTO activity_logs (id, user_id, action, module, record_id, details, ip_address, created_at) VALUES ${rows} ON CONFLICT (id) DO NOTHING;`);
    }
    await sql`SELECT setval('activity_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM activity_logs));`;
  }

  console.log("\n=========================================");
  console.log("NEON POSTGRESQL DATABASE SETUP COMPLETE!");
  console.log("=========================================");

  // Verify counts
  const usersCount = await sql`SELECT count(*) FROM users`;
  const recruitersCount = await sql`SELECT count(*) FROM recruiter_leads`;
  const candidatesCount = await sql`SELECT count(*) FROM candidates`;
  const followUpsCount = await sql`SELECT count(*) FROM follow_ups`;
  const logsCount = await sql`SELECT count(*) FROM activity_logs`;
  console.log(`Verified Neon DB Counts:
- Users: ${usersCount[0].count}
- Recruiters: ${recruitersCount[0].count}
- Candidates: ${candidatesCount[0].count}
- Follow-ups: ${followUpsCount[0].count}
- Activity Logs: ${logsCount[0].count}`);
}

setup().catch(err => {
  console.error("Setup Error:", err);
  process.exit(1);
});
