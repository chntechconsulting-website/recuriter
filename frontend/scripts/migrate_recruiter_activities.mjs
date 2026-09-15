import { neon } from '@neondatabase/serverless';

const connectionString = process.env.VITE_DATABASE_URL || "postgresql://neondb_owner:npg_4xTuzRpw9tmY@ep-lucky-feather-b3y9zm31-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

function sqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function migrate() {
  console.log("Connecting to Neon DB for recruiter activity migration...");

  // 1. Add employee_id and last_login columns to users table
  console.log("Adding employee_id and last_login to users table...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`;

  // Update employee_id for users if null
  const users = await sql`SELECT id, name, role, employee_id, last_login FROM users ORDER BY id ASC`;
  for (const u of users) {
    const empId = u.employee_id || `EMP-${String(u.id).padStart(4, '0')}`;
    const lastLogin = u.last_login || new Date(Date.now() - Math.floor(Math.random() * 36) * 3600 * 1000).toISOString();
    await sql.query(`
      UPDATE users 
      SET employee_id = ${sqlVal(empId)}, 
          last_login = COALESCE(last_login, ${sqlVal(lastLogin)})
      WHERE id = ${u.id}
    `);
  }
  console.log("Updated users with employee_id and last_login.");

  // 2. Create recruiter_activities table
  console.log("Creating recruiter_activities table...");
  await sql`
    CREATE TABLE IF NOT EXISTS recruiter_activities (
      id SERIAL PRIMARY KEY,
      recruiter_id INT REFERENCES users(id) ON DELETE CASCADE,
      recruiter_name VARCHAR(150) NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      candidate_id VARCHAR(50),
      candidate_name VARCHAR(255),
      job_id VARCHAR(50),
      job_name VARCHAR(255),
      previous_status VARCHAR(100),
      new_status VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_rec_act_recruiter_id ON recruiter_activities(recruiter_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_rec_act_created_at ON recruiter_activities(created_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_rec_act_action_type ON recruiter_activities(action_type);`;
  console.log("recruiter_activities table and indexes ready.");

  // 3. Seed initial activities if empty
  const actCountRes = await sql`SELECT count(*) FROM recruiter_activities`;
  const existingCount = parseInt(actCountRes[0].count, 10);
  console.log(`Current recruiter_activities count: ${existingCount}`);

  if (existingCount === 0) {
    console.log("Seeding realistic historical recruiter activities and syncing candidate statuses...");

    // Get recruiters (STAFF and ADMIN)
    const staffUsers = await sql`SELECT id, name FROM users WHERE role IN ('STAFF', 'RECRUITER') OR id IN (16, 18, 19, 20)`;
    
    // Get sample jobs from recruiter_leads
    const sampleJobs = await sql`SELECT id, lead_id, company_name, job_role FROM recruiter_leads WHERE job_role IS NOT NULL AND job_role != '' LIMIT 30`;

    const activitiesToInsert = [];
    const now = new Date();

    for (const recruiter of staffUsers) {
      // Find candidates assigned to this recruiter
      const candList = await sql.query(`SELECT id, candidate_id, name FROM candidates WHERE assigned_to = ${recruiter.id} ORDER BY id ASC LIMIT 60`);
      if (candList.length === 0) continue;

      const jobsForRecruiter = sampleJobs.length > 0 ? sampleJobs : [
        { id: 101, lead_id: 'REC-000101', company_name: 'Tata Consultancy Services', job_role: 'Graduate Trainee' },
        { id: 102, lead_id: 'REC-000102', company_name: 'Infosys BPM', job_role: 'Associate Consultant' },
        { id: 103, lead_id: 'REC-000103', company_name: 'L&T Technology Services', job_role: 'Design Engineer' },
        { id: 104, lead_id: 'REC-000104', company_name: 'Wipro Technologies', job_role: 'Project Engineer' }
      ];

      // Distribute candidates into stages:
      // 0..4: JOINED
      // 5..10: SELECTED
      // 11..18: INTERVIEW_SCHEDULED
      // 19..28: SHORTLISTED
      // 29..42: CONTACTED
      // 43..48: REJECTED
      // 49..59: NEW (just registered/assigned)

      for (let i = 0; i < candList.length; i++) {
        const c = candList[i];
        const job = jobsForRecruiter[i % jobsForRecruiter.length];
        const jobName = `${job.company_name} - ${job.job_role || 'General Recruitment'}`;

        if (i < 5) {
          // Joined candidate journey
          const d1 = new Date(now.getTime() - (22 * 86400000) - (i * 3600000));
          const d2 = new Date(now.getTime() - (15 * 86400000) - (i * 3600000));
          const d3 = new Date(now.getTime() - (8 * 86400000) - (i * 3600000));
          const d4 = new Date(now.getTime() - (2 * 86400000) - (i * 3600000));
          const d5 = new Date(now.getTime() - (4 * 3600000) - (i * 1800000));

          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate assigned', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'NEW', description: `Assigned candidate to ${job.company_name} pipeline`, created_at: d1.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate contacted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'CONTACTED', description: 'Connected via phone. Candidate confirmed interest and availability.', created_at: d2.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate shortlisted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'CONTACTED', new_status: 'SHORTLISTED', description: 'Screened resume and profile. Qualified for technical interview round.', created_at: d3.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Interview scheduled', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'SHORTLISTED', new_status: 'INTERVIEW_SCHEDULED', description: `Final interview scheduled with ${job.company_name} panel.`, created_at: d4.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate selected', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'INTERVIEW_SCHEDULED', new_status: 'SELECTED', description: 'Selected by client panel after technical & HR evaluations.', created_at: new Date(d5.getTime() - 3600000).toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate joined', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'SELECTED', new_status: 'JOINED', description: 'Offer letter accepted and candidate reported on day one.', created_at: d5.toISOString() }
          );

          await sql.query(`UPDATE candidates SET status = 'JOINED' WHERE id = ${c.id}`);
        } else if (i < 11) {
          // Selected
          const d1 = new Date(now.getTime() - (12 * 86400000) - (i * 3600000));
          const d2 = new Date(now.getTime() - (6 * 86400000) - (i * 3600000));
          const d3 = new Date(now.getTime() - (1 * 86400000) - (i * 1800000));

          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate contacted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'CONTACTED', description: 'Discussed role requirements and salary expectations.', created_at: d1.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Interview scheduled', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'CONTACTED', new_status: 'INTERVIEW_SCHEDULED', description: 'Round 1 Assessment & Interview scheduled.', created_at: d2.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate selected', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'INTERVIEW_SCHEDULED', new_status: 'SELECTED', description: 'Client confirmed selection. Documentation and offer rollout pending.', created_at: d3.toISOString() }
          );

          await sql.query(`UPDATE candidates SET status = 'SELECTED' WHERE id = ${c.id}`);
        } else if (i < 19) {
          // Interview Scheduled
          const d1 = new Date(now.getTime() - (4 * 86400000) - (i * 3600000));
          const d2 = new Date(now.getTime() - (1 * 86400000) - (i * 1800000));

          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate shortlisted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'SHORTLISTED', description: 'Shortlisted based on relevant experience and qualification criteria.', created_at: d1.toISOString() },
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Interview scheduled', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'SHORTLISTED', new_status: 'INTERVIEW_SCHEDULED', description: `Virtual technical round scheduled with ${job.company_name}.`, created_at: d2.toISOString() }
          );

          await sql.query(`UPDATE candidates SET status = 'INTERVIEW_SCHEDULED' WHERE id = ${c.id}`);
        } else if (i < 29) {
          // Shortlisted
          const d1 = new Date(now.getTime() - (2 * 86400000) - (i * 1800000));
          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate shortlisted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'SHORTLISTED', description: 'Profile screened and marked as high-potential match.', created_at: d1.toISOString() }
          );
          await sql.query(`UPDATE candidates SET status = 'SHORTLISTED' WHERE id = ${c.id}`);
        } else if (i < 43) {
          // Contacted
          const d1 = new Date(now.getTime() - (Math.floor(Math.random() * 24) * 3600000));
          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate contacted', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'NEW', new_status: 'CONTACTED', description: 'Called candidate. Candidate requested job details via WhatsApp.', created_at: d1.toISOString() }
          );
          await sql.query(`UPDATE candidates SET status = 'CONTACTED' WHERE id = ${c.id}`);
        } else if (i < 49) {
          // Rejected
          const d1 = new Date(now.getTime() - (5 * 86400000) - (i * 3600000));
          activitiesToInsert.push(
            { recruiter_id: recruiter.id, recruiter_name: recruiter.name, action_type: 'Candidate rejected', candidate_id: c.candidate_id, candidate_name: c.name, job_id: job.lead_id || String(job.id), job_name: jobName, previous_status: 'CONTACTED', new_status: 'REJECTED', description: 'Candidate declined relocation / salary budget mismatch.', created_at: d1.toISOString() }
          );
          await sql.query(`UPDATE candidates SET status = 'REJECTED' WHERE id = ${c.id}`);
        }
      }
    }

    // Insert activities in batches of 100
    const chunkSize = 100;
    for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
      const chunk = activitiesToInsert.slice(i, i + chunkSize);
      const rows = chunk.map(a => 
        `(${sqlVal(a.recruiter_id)}, ${sqlVal(a.recruiter_name)}, ${sqlVal(a.action_type)}, ${sqlVal(a.candidate_id)}, ${sqlVal(a.candidate_name)}, ${sqlVal(a.job_id)}, ${sqlVal(a.job_name)}, ${sqlVal(a.previous_status)}, ${sqlVal(a.new_status)}, ${sqlVal(a.description)}, ${sqlVal(a.created_at)})`
      ).join(',\n');

      await sql.query(`
        INSERT INTO recruiter_activities (
          recruiter_id, recruiter_name, action_type, candidate_id, candidate_name,
          job_id, job_name, previous_status, new_status, description, created_at
        ) VALUES ${rows};
      `);
    }

    console.log(`Successfully seeded ${activitiesToInsert.length} recruiter activity records!`);
  }

  // Summary counts
  const count = await sql`SELECT count(*) FROM recruiter_activities`;
  console.log(`Total records in recruiter_activities: ${count[0].count}`);
  console.log("Migration completed successfully!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
