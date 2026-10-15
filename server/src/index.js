import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, seedDevelopmentAccounts, audit, officeStages } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'local-only-change-this-secret';
if (JWT_SECRET === 'local-only-change-this-secret' && process.env.NODE_ENV === 'production') {
  throw new Error('Set JWT_SECRET before production startup.');
}
app.use(helmet({contentSecurityPolicy:false}));
app.use(cors({origin: process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(',') : true}));
app.use(express.json({limit:'8mb'}));
seedDevelopmentAccounts(process.env);

const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const auth = (req,res,next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    if (!token) return res.status(401).json({error:'Please sign in.'});
    req.user = jwt.verify(token, JWT_SECRET);
    const live = db.prepare('SELECT id,name,email,role,office FROM users WHERE id=?').get(req.user.id);
    if (!live) return res.status(401).json({error:'Account not found.'});
    req.user = live;
    next();
  } catch { return res.status(401).json({error:'Session expired. Please sign in again.'}); }
};
const requireRole = (...roles) => (req,res,next) => roles.includes(req.user.role) ? next() : res.status(403).json({error:'You do not have permission for this action.'});
const profile = u => ({id:u.id,name:u.name,email:u.email,role:u.role,office:u.office});
const graduandForUser = userId => db.prepare('SELECT g.*,u.name,u.email FROM graduands g JOIN users u ON u.id=g.user_id WHERE g.user_id=?').get(userId);
const stagesFor = gid => db.prepare('SELECT stage_key AS id,office,description,status,comment,updated_at AS updated FROM clearance_stages WHERE graduand_id=? ORDER BY id').all(gid);
const progressFor = gid => {
  const rows=stagesFor(gid); return Math.round(rows.filter(s=>s.status==='Cleared').length / Math.max(rows.length,1)*100);
};
const getWorkspace = user => {
  if (user.role === 'Graduand') {
    const g=graduandForUser(user.id);
    if (!g) return {stages:[],payments:[],requests:[],graduates:[],offices:officeStages.map(s=>s[1])};
    const payments=db.prepare('SELECT id,amount,method,status,created_at AS date,provider_reference AS reference FROM payment_intents WHERE graduand_id=? ORDER BY id DESC').all(g.id);
    const requests=stagesFor(g.id).filter(s=>['Pending','In review','Action required'].includes(s.status)).map(s=>({...s,requestId:`${g.id}::${s.id}`,student:g.name}));
    return {stages:stagesFor(g.id),payments,requests,graduates:[],offices:officeStages.map(s=>s[1]),graduand:{registrationNo:g.registration_no,programme:g.programme,cohort:g.cohort}};
  }
  const grads=db.prepare(`SELECT g.id,g.registration_no AS registrationNo,g.programme,g.cohort,u.name,u.email
    FROM graduands g JOIN users u ON u.id=g.user_id ORDER BY u.name`).all();
  const graduates=grads.map(g=>({id:g.registrationNo,name:g.name,programme:g.programme,school:'',year:g.cohort,progress:progressFor(g.id),status:progressFor(g.id)===100?'Fully cleared':'In progress',feeBalance:0,graduandId:g.id,email:g.email}));
  const allRequests=db.prepare(`SELECT cs.*,g.id AS graduand_id,g.registration_no,u.name AS student
    FROM clearance_stages cs JOIN graduands g ON g.id=cs.graduand_id JOIN users u ON u.id=g.user_id
    WHERE cs.status IN ('Pending','In review','Action required') ORDER BY cs.id DESC`).all();
  const requests=allRequests.filter(r=>user.role==='Admin'||r.office===user.office).map(r=>({id:`${r.graduand_id}::${r.stage_key}`,requestId:`${r.graduand_id}::${r.stage_key}`,student:r.student,registrationNo:r.registration_no,office:r.office,detail:r.description,status:r.status,date:r.updated_at||'',comment:r.comment||''}));
  const payments=db.prepare(`SELECT p.id,p.amount,p.method,p.status,p.created_at AS date,p.provider_reference AS reference,u.name AS student,g.registration_no AS registrationNo
    FROM payment_intents p JOIN graduands g ON g.id=p.graduand_id JOIN users u ON u.id=g.user_id ORDER BY p.id DESC`).all();
  return {stages:[],payments,requests,graduates,offices:officeStages.map(s=>s[1])};
};

app.get('/api/health',(_req,res)=>res.json({ok:true,service:'Graduant Tracer API'}));
app.post('/api/auth/login', asyncRoute(async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase();
  const password=String(req.body?.password||'');
  if (!email||!password) return res.status(400).json({error:'Email and password are required.'});
  const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !(await bcrypt.compare(password,user.password_hash))) {
    audit(null,'login_failed',email,'Invalid credentials');
    return res.status(401).json({error:'Incorrect email or password.'});
  }
  const token=jwt.sign({id:user.id},JWT_SECRET,{expiresIn:'12h'});
  audit(user.id,'login',email,'Successful sign-in');
  res.json({token,user:profile(user)});
}));
app.get('/api/auth/me',auth,(req,res)=>res.json({user:profile(req.user)}));
app.post('/api/auth/change-password',auth,asyncRoute(async(req,res)=>{
  const oldPassword=String(req.body?.oldPassword||''), newPassword=String(req.body?.newPassword||'');
  if(newPassword.length<12) return res.status(400).json({error:'New password must be at least 12 characters.'});
  const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(req.user.id);
  if(!row||!(await bcrypt.compare(oldPassword,row.password_hash))) return res.status(400).json({error:'Current password is incorrect.'});
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(await bcrypt.hash(newPassword,12),req.user.id);
  audit(req.user.id,'password_changed',req.user.email,'Password updated');
  res.json({ok:true});
}));
app.get('/api/workspace',auth,(req,res)=>res.json({role:req.user.role,assignedOffice:req.user.office,workspace:getWorkspace(req.user)}));
app.post('/api/clearance/submit',auth,requireRole('Graduand'),(req,res)=>{
  const stageKey=String(req.body?.stageId||'');
  const g=graduandForUser(req.user.id);
  if(!g) return res.status(404).json({error:'Graduand profile not found.'});
  const stages=stagesFor(g.id);
  const next=stages.find(s=>s.status!=='Cleared');
  if(!next||next.id!==stageKey) return res.status(409).json({error:'Submit only the next uncleared office.'});
  if(!['Not started','Action required'].includes(next.status)) return res.status(409).json({error:'This stage is already awaiting review or cleared.'});
  db.prepare(`UPDATE clearance_stages SET status='Pending',comment='',updated_at=CURRENT_TIMESTAMP WHERE graduand_id=? AND stage_key=?`).run(g.id,stageKey);
  audit(req.user.id,'clearance_submitted',`${g.registration_no}:${stageKey}`,next.office);
  res.json({ok:true,stages:stagesFor(g.id)});
});
app.post('/api/clearance/decision',auth,requireRole('Staff','Admin'),(req,res)=>{
  const [gidText,stageKey]=String(req.body?.requestId||'').split('::');
  const decision=String(req.body?.decision||''), comment=String(req.body?.comment||'').trim();
  if(!gidText||!stageKey||!['Cleared','Action required'].includes(decision)) return res.status(400).json({error:'Invalid request or decision.'});
  if(decision==='Action required'&&!comment) return res.status(400).json({error:'Enter the reason corrections are required.'});
  const stage=db.prepare('SELECT * FROM clearance_stages WHERE graduand_id=? AND stage_key=?').get(Number(gidText),stageKey);
  if(!stage) return res.status(404).json({error:'Clearance request not found.'});
  if(req.user.role==='Staff'&&req.user.office!==stage.office) return res.status(403).json({error:'Your account is not assigned to this office.'});
  if(!['Pending','In review'].includes(stage.status)) return res.status(409).json({error:'This request is not awaiting a decision.'});
  db.prepare('UPDATE clearance_stages SET status=?,comment=?,updated_at=CURRENT_TIMESTAMP,reviewed_by=? WHERE graduand_id=? AND stage_key=?').run(decision,comment,req.user.id,Number(gidText),stageKey);
  audit(req.user.id,'clearance_decision',`${gidText}:${stageKey}`,`${decision}: ${comment}`);
  res.json({ok:true,stage:{...stage,status:decision,comment}});
});
app.post('/api/payments/intents',auth,requireRole('Graduand'),(req,res)=>{
  const amount=Number(req.body?.amount), method=String(req.body?.method||'M-Pesa');
  if(!Number.isSafeInteger(amount)||amount<1||amount>10000000) return res.status(400).json({error:'Enter a valid amount in KSh.'});
  const g=graduandForUser(req.user.id);
  if(!g) return res.status(404).json({error:'Graduand profile not found.'});
  const result=db.prepare('INSERT INTO payment_intents(graduand_id,amount,method) VALUES(?,?,?)').run(g.id,amount,method);
  audit(req.user.id,'payment_intent_created',String(result.lastInsertRowid),`${amount} KES; not charged`);
  res.status(201).json({ok:true,payment:{id:result.lastInsertRowid,amount,method,status:'Awaiting verified payment provider',date:new Date().toISOString()},message:'Intent only; no money was charged.'});
});
app.post('/api/admin/users',auth,requireRole('Admin'),asyncRoute(async(req,res)=>{
  const name=String(req.body?.name||'').trim(), email=String(req.body?.email||'').trim().toLowerCase();
  const password=String(req.body?.password||''), role=String(req.body?.role||''), office=String(req.body?.office||'');
  if(!name||!email.includes('@')||password.length<12||!['Graduand','Staff','Admin'].includes(role)) return res.status(400).json({error:'Enter a name, valid email, 12+ character password and role.'});
  if(role==='Staff'&&!officeStages.some(s=>s[1]===office)) return res.status(400).json({error:'Choose an approved office.'});
  if(db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(409).json({error:'That email already exists.'});
  const userId=Number(db.prepare('INSERT INTO users(name,email,password_hash,role,office) VALUES(?,?,?,?,?)').run(name,email,await bcrypt.hash(password,12),role,role==='Staff'?office:null).lastInsertRowid);
  if(role==='Graduand'){
    const reg=String(req.body?.registrationNo||'').trim();
    if(!reg) { db.prepare('DELETE FROM users WHERE id=?').run(userId); return res.status(400).json({error:'Registration number is required for a graduand.'});}
    const programme=String(req.body?.programme||'Not provided');
    const gId=Number(db.prepare('INSERT INTO graduands(user_id,registration_no,programme) VALUES(?,?,?)').run(userId,reg,programme).lastInsertRowid);
    for(const [key,off,description] of officeStages) db.prepare('INSERT INTO clearance_stages(graduand_id,stage_key,office,description) VALUES(?,?,?,?)').run(gId,key,off,description);
  }
  audit(req.user.id,'user_created',email,role);
  res.status(201).json({ok:true,user:{id:userId,name,email,role,office:role==='Staff'?office:null}});
}));
app.get('/api/admin/users',auth,requireRole('Admin'),(_req,res)=>{
  const users=db.prepare('SELECT id,name,email,role,office,created_at AS createdAt FROM users ORDER BY id').all();
  res.json({users});
});
app.get('/api/admin/audit',auth,requireRole('Admin'),(_req,res)=>{
  res.json({events:db.prepare(`SELECT a.id,a.action,a.subject,a.details,a.created_at AS createdAt,u.email AS actor
    FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 250`).all()});
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(500).json({error:'Unexpected server error. Check the server terminal for details.'});
});
app.listen(PORT,()=>console.log(`Graduant Tracer API listening on http://localhost:${PORT}`));
