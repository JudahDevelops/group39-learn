# Group decisions

| Item | Decision |
|---|---|
| Title | Intelligent Hostel Management System: Automated Complaint Triage and Escalation for University Hostels |
| RQ1 | How can a computerised system be applied to manage student hostel accommodation in universities? |
| RQ2 | What methods have been used to allocate hostel rooms and record hostel occupancy and complaints? |
| RQ3 | What intelligent features can improve room allocation, maintenance handling and reporting in hostel management systems? |
| Aim | To design and implement a web-based IHMS that automates room allocation and escalates unresolved maintenance complaints according to their urgency |
| ★ module | Complaint Triage and Escalation Engine |
| Value-add | Existing systems provide registration, rule-based room allocation and complaint logging, but the IHMS introduces automatic complaint triage with deadline-based escalation |
| Tiers | Client: Student Portal, Staff Dashboard, Admin Dashboard · Logic: User Management, Room Allocation, Complaint Management, ★ Triage and Escalation, Reporting · Data: PostgreSQL, complaint history and audit log · Output: Email Notification Service, Report Export |
| Deadlines | Urgent 24 h · Normal 72 h · Low 7 days · checked every 15 min · L1 warden at *d* · L2 Student Affairs at 2*d* |
| Stack | HTML/CSS/JS · FastAPI + Pydantic · PostgreSQL + SQLAlchemy · APScheduler · SMTP · bcrypt + JWT · Jev (optional) |

## Open decisions

1. **Who presents which slides** at the defence (Lesson 5.1).
2. **Six design questions the paper doesn't settle** (Lesson 5.3). Track B uses placeholders until the group decides:
   - urgency when no keyword matches (placeholder: normal);
   - who handles "other" complaints;
   - whether wardens can correct triage, and whether the deadline resets;
   - what happens when an email fails (placeholder: log it and carry on);
   - how fee clearance gets in (placeholder: an admin marks it);
   - whether the deadline clock pauses at night or weekends (placeholder: no).
3. **Whether the lecturer wants the system hosted online** or demonstrated from a laptop. Track B currently ends with a laptop demo.
