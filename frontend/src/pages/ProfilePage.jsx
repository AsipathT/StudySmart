import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Form, Input, Select, DatePicker, Button,
  Upload, message, Spin, Modal, Switch, List, Tabs,
} from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, BookOutlined,
  CalendarOutlined, EnvironmentOutlined, IdcardOutlined,
  EditOutlined, CameraOutlined, LockOutlined, SaveOutlined,
  CloseOutlined, TrophyOutlined, BarChartOutlined,
  SafetyOutlined, SettingOutlined, NotificationOutlined,
  DownloadOutlined, ShareAltOutlined, CheckOutlined,
  RiseOutlined, FallOutlined, StarOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import profileService from '../services/profile.service';

const { Option } = Select;
const { TabPane } = Tabs;

/* ── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  bg:        '#f0f5ff',
  white:     '#ffffff',
  border:    '#dbeafe',
  primary:   '#2563eb',
  primaryBg: '#eff6ff',
  primaryLt: '#dbeafe',
  purple:    '#7c3aed',
  purpleBg:  '#f5f3ff',
  purpleLt:  '#ede9fe',
  success:   '#059669',
  successBg: '#ecfdf5',
  successLt: '#d1fae5',
  warning:   '#d97706',
  warningBg: '#fffbeb',
  error:     '#dc2626',
  errorBg:   '#fef2f2',
  text:      '#1e293b',
  textMd:    '#475569',
  textSm:    '#64748b',
  shadow:    '0 1px 6px rgba(37,99,235,0.09)',
  shadowMd:  '0 4px 20px rgba(37,99,235,0.12)',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = v => {
  if (!v || v === 'N/A') return '—';
  if (v && v.$isDayjsObject) return v.format('YYYY-MM-DD');
  return String(v);
};

const scoreColor = s => s >= 75 ? C.success : s >= 55 ? C.warning : C.error;
const scoreBg    = s => s >= 75 ? C.successBg : s >= 55 ? C.warningBg : C.errorBg;
const scoreLt    = s => s >= 75 ? C.successLt : s >= 55 ? '#fde68a' : '#fecaca';

const gpaColor = g => g >= 3.5 ? C.success : g >= 2.5 ? C.primary : g >= 2.0 ? C.warning : C.error;

const gradeLabel = s => {
  if (s >= 85) return 'A+'; if (s >= 75) return 'A';
  if (s >= 70) return 'B+'; if (s >= 65) return 'B';
  if (s >= 60) return 'C+'; if (s >= 55) return 'C';
  if (s >= 50) return 'D';  return 'F';
};

/* ── Reusable atoms ──────────────────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
    boxShadow:C.shadow, padding:22, ...style }}>{children}</div>
);

const SLabel = ({ color=C.primary, children }) => (
  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase',
    color:C.textSm, display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
    <span style={{ width:5,height:5,borderRadius:'50%',background:color,flexShrink:0 }} />
    {children}
    <span style={{ flex:1,height:1,background:C.border }} />
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 0',
    borderBottom:`1px solid ${C.border}` }}>
    <div style={{ width:32,height:32,borderRadius:8,background:C.primaryBg,flexShrink:0,
      display:'flex',alignItems:'center',justifyContent:'center',color:C.primary,fontSize:14 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize:11,fontWeight:600,color:C.textSm,textTransform:'uppercase',letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ fontSize:14,fontWeight:600,color:C.text,marginTop:2 }}>{value || '—'}</div>
    </div>
  </div>
);

/* ── GPA Ring ─────────────────────────────────────────────────────────────── */
const GpaRing = ({ gpa, avg, total }) => {
  const r=52, cx=64, cy=64, circ=2*Math.PI*r;
  const arc   = circ*0.75;
  const fill  = Math.min((gpa/4.0),1)*arc;
  const col   = gpaColor(gpa);
  const off   = -(circ*0.125);
  const rot   = `rotate(135 ${cx} ${cy})`;
  return (
    <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
      {/* Ring */}
      <div style={{ position:'relative', width:128, height:128, flexShrink:0 }}>
        <svg width={128} height={128}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10}
            strokeDasharray={`${arc} ${circ-arc}`} strokeDashoffset={off}
            strokeLinecap="round" transform={rot} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={10}
            strokeDasharray={`${fill} ${circ-fill}`} strokeDashoffset={off}
            strokeLinecap="round" transform={rot}
            style={{ filter:`drop-shadow(0 0 6px ${col}80)`, transition:'stroke-dasharray 1s' }} />
        </svg>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center' }}>
          <div style={{ fontSize:24,fontWeight:800,color:col,lineHeight:1 }}>{gpa.toFixed(2)}</div>
          <div style={{ fontSize:10,color:C.textSm,marginTop:2 }}>/ 4.0</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ flex:1, minWidth:140 }}>
        {[
          { label:'Current GPA',    val: gpa.toFixed(2),  col: gpaColor(gpa),  bg: gpa>=2?C.primaryBg:C.errorBg },
          { label:'Average Score',  val: `${avg}%`,       col: scoreColor(avg),bg: scoreBg(avg) },
          { label:'Assessments',    val: total,            col: C.purple,       bg: C.purpleBg },
        ].map(s => (
          <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'8px 12px', marginBottom:8, borderRadius:10, background:s.bg }}>
            <span style={{ fontSize:12,color:C.textMd,fontWeight:500 }}>{s.label}</span>
            <span style={{ fontSize:16,fontWeight:800,color:s.col }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Subject Performance Card ─────────────────────────────────────────────── */
const SubjectCard = ({ s }) => {
  const col = scoreColor(s.score);
  const bg  = scoreBg(s.score);
  const lt  = scoreLt(s.score);
  return (
    <div style={{ background:bg, border:`1px solid ${lt}`, borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.text,flex:1,paddingRight:8 }}>{s.subject}</div>
        <div style={{ fontSize:22,fontWeight:800,color:col,lineHeight:1 }}>{gradeLabel(s.score)}</div>
      </div>
      {/* Score bar */}
      <div style={{ height:6,background:'rgba(0,0,0,0.07)',borderRadius:3,marginBottom:8,overflow:'hidden' }}>
        <div style={{ width:`${Math.min(s.score,100)}%`,height:'100%',background:col,borderRadius:3,transition:'width 1s' }} />
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ fontSize:20,fontWeight:800,color:col }}>{s.score}%</span>
        <div style={{ display:'flex',gap:6 }}>
          <span style={{ fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:10,
            background: s.status==='Pass'?C.successBg:C.errorBg,
            color:      s.status==='Pass'?C.success:C.error,
            border:`1px solid ${s.status==='Pass'?C.successLt:'#fecaca'}` }}>
            {s.status}
          </span>
          <span style={{ fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:10,
            background:'rgba(0,0,0,0.05)',color:C.textMd }}>
            GPA: {s.gpa?.toFixed(1)||'—'}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── MAIN COMPONENT ──────────────────────────────────────────────────────── */
const ProfilePage = () => {
  const { user }                = useAuth();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [data,     setData]     = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab,setActiveTab]= useState('1');
  const [avatarUrl,setAvatarUrl]= useState(null);
  const [avatarBusy,setAvatarBusy]= useState(false);
  const [settingsOpen,setSettingsOpen]= useState(false);

  const [editForm]     = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await profileService.getProfile();
      if (res?.success) {
        setData(res.data);
        if (res.data?.personalInfo?.avatarUrl) {
          setAvatarUrl(`http://localhost:5000${res.data.personalInfo.avatarUrl}`);
        }
      } else { message.error('Failed to load profile'); }
    } catch { message.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? (values.dateOfBirth.$isDayjsObject ? values.dateOfBirth.format('YYYY-MM-DD') : fmtDate(values.dateOfBirth))
          : undefined,
      };
      const res = await profileService.updateProfile(payload);
      if (res?.success) {
        setData(prev => ({ ...prev, personalInfo: { ...prev?.personalInfo, ...payload } }));
        message.success('Profile updated!');
        setEditMode(false);
      } else { message.error(res?.message || 'Update failed'); }
    } catch { message.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleAvatar = async ({ file }) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const res = await profileService.updateAvatar(fd);
      if (res?.success) {
        const full = res.data?.avatarUrl.startsWith('http') 
          ? res.data.avatarUrl 
          : `http://localhost:5000${res.data?.avatarUrl}`;
        setAvatarUrl(full);
        sessionStorage.setItem('sidebarAvatarUrl', full);
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: full } }));
        message.success('Profile picture updated!');
        // Reload profile data to ensure consistency
        await load();
      } else { message.error('Upload failed'); }
    } catch { message.error('Avatar upload failed'); }
    finally { setAvatarBusy(false); }
  };

  const pi   = () => data?.personalInfo  || {};
  const ai   = () => data?.academicInfo  || {};
  const perf = () => data?.performance   || {};
  const sh   = () => data?.studyHabits   || {};

  const initForm = () => {
    const info = pi();
    editForm.setFieldsValue({
      ...info,
      dateOfBirth: info.dateOfBirth && info.dateOfBirth !== '—'
        ? dayjs(info.dateOfBirth) : undefined,
    });
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex',
      justifyContent:'center', alignItems:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:56,height:56,borderRadius:16,background:C.primary,
        display:'flex',alignItems:'center',justifyContent:'center' }}>
        <UserOutlined style={{ color:'#fff',fontSize:24 }} />
      </div>
      <Spin size="large" />
      <span style={{ color:C.textMd,fontSize:14 }}>Loading your profile…</span>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex',
      justifyContent:'center', alignItems:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>😕</div>
        <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Couldn't load profile</div>
        <Button type="primary" onClick={load}>Retry</Button>
      </div>
    </div>
  );

  const gpa  = ai().currentGPA || 0;
  const avg  = perf().overallAverage || 0;
  const tots = perf().totalAssessments || 0;
  const subj = perf().subjectPerformance || [];

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'24px 28px',
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #7c3aed 100%)`,
        borderRadius:18, padding:'32px 32px 28px', marginBottom:22,
        position:'relative', overflow:'hidden',
      }}>
        {/* decorative circles */}
        {[{s:200,op:0.06,t:-60,r:-40},{s:120,op:0.08,b:-30,r:80},{s:80,op:0.1,t:20,l:'45%'}].map((d,i)=>(
          <div key={i} style={{ position:'absolute', width:d.s,height:d.s, borderRadius:'50%',
            background:'#fff', opacity:d.op, top:d.t, bottom:d.b, right:d.r, left:d.l }} />
        ))}

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:90, height:90, borderRadius:24,
              background: avatarUrl ? 'transparent' : 'rgba(255,255,255,0.2)',
              border:'3px solid rgba(255,255,255,0.4)',
              overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : <UserOutlined style={{ fontSize:36, color:'rgba(255,255,255,0.9)' }} />}
            </div>
            <Upload accept="image/*" showUploadList={false} customRequest={handleAvatar} disabled={avatarBusy}>
              <div style={{
                position:'absolute', bottom:-4, right:-4,
                width:28,height:28,borderRadius:'50%',
                background:C.primary, border:'2px solid #fff',
                display:'flex',alignItems:'center',justifyContent:'center', cursor:'pointer',
                boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
              }}>
                {avatarBusy ? <Spin size="small" /> : <CameraOutlined style={{ color:'#fff',fontSize:13 }} />}
              </div>
            </Upload>
          </div>

          {/* Name & tags */}
          <div style={{ flex:1 }}>
            <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>
              {pi().name || user?.name || 'Student'}
            </h1>
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {[
                { val: pi().studentNumber, icon:'🎓', bg:'rgba(255,255,255,0.15)' },
                { val: pi().email,         icon:'✉',  bg:'rgba(255,255,255,0.12)' },
                { val: pi().phone,         icon:'📱', bg:'rgba(255,255,255,0.12)' },
                { val: ai().semester ? `Semester ${ai().semester}` : null, icon:'📅', bg:'rgba(124,58,237,0.4)' },
              ].filter(t=>t.val).map((t,i)=>(
                <span key={i} style={{
                  padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500,
                  background:t.bg, color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
                  backdropFilter:'blur(4px)',
                }}>
                  {t.icon} {t.val}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={()=>profileService.downloadProfileData().catch(()=>{})} style={{
              background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)',
              color:'#fff', padding:'9px 16px', borderRadius:10, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500,
            }}>
              <DownloadOutlined /> Export
            </button>
            <button onClick={()=>setSettingsOpen(true)} style={{
              background:'#fff', border:'none', color:C.primary,
              padding:'9px 18px', borderRadius:10, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700,
              boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <SettingOutlined /> Settings
            </button>
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ position:'relative', display:'flex', gap:0, marginTop:24,
          background:'rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.15)' }}>
          {[
            { label:'Current GPA',   val: gpa.toFixed(2),  sub:'/ 4.0' },
            { label:'Avg Score',     val: `${avg}%`,        sub:'overall' },
            { label:'Assessments',   val: tots,             sub:'submitted' },
            { label:'Subjects',      val: subj.length,      sub:'enrolled' },
          ].map((s,i)=>(
            <div key={i} style={{ flex:1, padding:'14px 16px', textAlign:'center',
              borderRight: i<3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ fontSize:22,fontWeight:800,color:'#fff',lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,0.7)',marginTop:4 }}>
                {s.label} <span style={{ opacity:0.6 }}>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:16,
        boxShadow:C.shadow, overflow:'hidden' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}
          tabBarStyle={{ padding:'0 24px', margin:0, borderBottom:`1px solid ${C.border}` }}
          tabBarGutter={8}>

          {/* ── TAB 1: Personal ──────────────────────────────────────────── */}
          <TabPane tab={<span><UserOutlined /> Personal</span>} key="1">
            <div style={{ padding:24 }}>
              {/* Edit toggle */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <SLabel>Personal Information</SLabel>
                {!editMode
                  ? <button onClick={()=>{ initForm(); setEditMode(true); }} style={{
                      display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
                      background:C.primaryBg, border:`1px solid ${C.primaryLt}`,
                      color:C.primary, fontWeight:600, fontSize:13, cursor:'pointer',
                    }}><EditOutlined /> Edit Profile</button>
                  : <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>setEditMode(false)} style={{
                        padding:'8px 16px', borderRadius:10, border:`1px solid ${C.border}`,
                        background:C.white, color:C.textMd, fontWeight:600, fontSize:13, cursor:'pointer',
                        display:'flex',alignItems:'center',gap:6,
                      }}><CloseOutlined /> Cancel</button>
                      <button onClick={()=>editForm.submit()} disabled={saving} style={{
                        padding:'8px 18px', borderRadius:10, border:'none',
                        background:C.primary, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                        display:'flex',alignItems:'center',gap:6,
                        boxShadow:`0 4px 12px ${C.primary}40`,
                      }}><SaveOutlined /> {saving?'Saving…':'Save Changes'}</button>
                    </div>}
              </div>

              {editMode ? (
                <Form form={editForm} layout="vertical" onFinish={handleSave} requiredMark={false}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px' }}>
                    {[
                      { name:'name',        label:'Full Name',    prefix:<UserOutlined />,  rules:[{required:true}] },
                      { name:'email',       label:'Email',        prefix:<MailOutlined />,   rules:[{required:true,type:'email'}] },
                      { name:'phone',       label:'Phone',        prefix:<PhoneOutlined /> },
                      { name:'nationality', label:'Nationality',  prefix:<EnvironmentOutlined /> },
                      { name:'nic',         label:'NIC',          prefix:<IdcardOutlined /> },
                      { name:'emergencyContact', label:'Emergency Contact', prefix:<PhoneOutlined /> },
                    ].map(f => (
                      <Form.Item key={f.name} name={f.name} label={<span style={{ fontWeight:600, color:C.text }}>{f.label}</span>} rules={f.rules}>
                        <Input prefix={f.prefix} size="large" style={{ borderRadius:10, borderColor:C.border }} />
                      </Form.Item>
                    ))}
                    <Form.Item name="dateOfBirth" label={<span style={{ fontWeight:600, color:C.text }}>Date of Birth</span>}>
                      <DatePicker style={{ width:'100%', borderRadius:10, borderColor:C.border }} size="large" format="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item name="gender" label={<span style={{ fontWeight:600, color:C.text }}>Gender</span>}>
                      <Select size="large" style={{ borderRadius:10 }}>
                        {['Male','Female','Other'].map(g=><Option key={g} value={g}>{g}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item name="bloodGroup" label={<span style={{ fontWeight:600, color:C.text }}>Blood Group</span>}>
                      <Select size="large">
                        {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><Option key={b} value={b}>{b}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item name="branch" label={<span style={{ fontWeight:600, color:C.text }}>Branch</span>}>
                      <Select size="large">
                        {['Malabe','Kandy','Jaffna','Matara','Kollupitiya','CCU'].map(b=><Option key={b} value={b.toLowerCase()}>{b}</Option>)}
                      </Select>
                    </Form.Item>
                  </div>
                  <Form.Item name="address" label={<span style={{ fontWeight:600, color:C.text }}>Address</span>}>
                    <Input.TextArea rows={2} style={{ borderRadius:10, borderColor:C.border }} />
                  </Form.Item>
                </Form>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px' }}>
                  {[
                    [<UserOutlined />,       'Full Name',        pi().name],
                    [<IdcardOutlined />,      'Student Number',   pi().studentNumber],
                    [<MailOutlined />,        'Email',            pi().email],
                    [<PhoneOutlined />,       'Phone',            pi().phone],
                    [<CalendarOutlined />,    'Date of Birth',    fmtDate(pi().dateOfBirth)],
                    [<UserOutlined />,        'Gender',           pi().gender],
                    [<EnvironmentOutlined />, 'Nationality',      pi().nationality],
                    [<IdcardOutlined />,      'NIC',              pi().nic],
                    ['🩸',                    'Blood Group',      pi().bloodGroup],
                    [<PhoneOutlined />,       'Emergency Contact',pi().emergencyContact],
                  ].map(([icon,label,val],i) => (
                    <InfoRow key={i} icon={icon} label={label} value={val} />
                  ))}
                  <div style={{ gridColumn:'1/-1' }}>
                    <InfoRow icon={<EnvironmentOutlined />} label="Address" value={pi().address} />
                  </div>
                </div>
              )}
            </div>
          </TabPane>

          {/* ── TAB 2: Academic ──────────────────────────────────────────── */}
          <TabPane tab={<span><BookOutlined /> Academic</span>} key="2">
            <div style={{ padding:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
                {/* GPA Card */}
                <Card>
                  <SLabel color={gpaColor(gpa)}>Academic Performance</SLabel>
                  <GpaRing gpa={gpa} avg={avg} total={tots} />
                  {gpa > 0 && (
                    <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10,
                      background: gpa>=2.0 ? C.successBg : C.warningBg,
                      border:`1px solid ${gpa>=2.0?C.successLt:'#fde68a'}`,
                      display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{gpa>=3.5?'🏆':gpa>=2.5?'📈':gpa>=2.0?'⚠️':'🚨'}</span>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700,color:C.text }}>
                          {gpa>=3.5?'Excellent Standing':gpa>=2.5?'Good Standing':gpa>=2.0?'Satisfactory':ai().academicStanding}
                        </div>
                        <div style={{ fontSize:11,color:C.textSm }}>Based on {tots} uploaded assessments</div>
                      </div>
                    </div>
                  )}
                  {gpa === 0 && (
                    <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10,
                      background:'#f8faff', border:`1px solid ${C.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:13, color:C.textSm }}>📤 Upload your marks file to see GPA</div>
                    </div>
                  )}
                </Card>

                {/* Academic Info */}
                <Card>
                  <SLabel color={C.purple}>Academic Details</SLabel>
                  {[
                    ['Program',      ai().program],
                    ['Batch',        ai().batch],
                    ['Semester',     ai().semester ? `Semester ${ai().semester}` : null],
                    ['Academic Year',ai().academicYear],
                    ['Branch',       ai().branch],
                    ['Supervisor',   ai().supervisor],
                  ].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between',
                      padding:'10px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                      <span style={{ color:C.textSm, fontWeight:500 }}>{l}</span>
                      <span style={{ color:C.text, fontWeight:700 }}>{v||'—'}</span>
                    </div>
                  ))}
                </Card>
              </div>

              {/* Score breakdown per subject */}
              {subj.length > 0 && (
                <Card>
                  <SLabel>Subject Scores from Uploaded Marks</SLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
                    {subj.map((s,i) => <SubjectCard key={i} s={s} />)}
                  </div>
                </Card>
              )}
              {subj.length === 0 && (
                <Card style={{ textAlign:'center', padding:'40px 24px' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📤</div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>No marks data yet</div>
                  <div style={{ fontSize:13, color:C.textSm, marginBottom:16 }}>Upload your marks file to see subject scores and GPA</div>
                  <a href="/upload" style={{ padding:'10px 24px', borderRadius:10, background:C.primary,
                    color:'#fff', fontWeight:600, fontSize:13, textDecoration:'none' }}>
                    Go to Upload
                  </a>
                </Card>
              )}
            </div>
          </TabPane>

          {/* ── TAB 3: Performance ───────────────────────────────────────── */}
          <TabPane tab={<span><BarChartOutlined /> Performance</span>} key="3">
            <div style={{ padding:24 }}>
              {/* Top stat row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
                {[
                  { label:'Average Score',  val:`${avg}%`,       col:scoreColor(avg),  bg:scoreBg(avg),   icon:'📊' },
                  { label:'Current GPA',    val:gpa.toFixed(2),  col:gpaColor(gpa),    bg:C.primaryBg,    icon:'🎓' },
                  { label:'Highest Score',  val:`${perf().highestScore||0}%`, col:C.success, bg:C.successBg, icon:'⬆' },
                  { label:'Total Tests',    val:tots,             col:C.purple,          bg:C.purpleBg,     icon:'📝' },
                ].map((s,i)=>(
                  <div key={i} style={{ background:s.bg, borderRadius:12, padding:'16px 14px',
                    border:`1px solid ${s.col}20` }}>
                    <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:s.col, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:11, color:C.textSm, marginTop:4, fontWeight:500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <Card style={{ marginBottom:20 }}>
                <SLabel>Score Trend Over Time</SLabel>
                {(perf().performanceTrend||[]).length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={perf().performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month" tick={{ fontSize:11, fill:C.textSm }} />
                      <YAxis domain={[0,100]} tick={{ fontSize:11, fill:C.textSm }} />
                      <RTooltip contentStyle={{ borderRadius:10, border:`1px solid ${C.border}`, fontSize:12 }} />
                      <Legend wrapperStyle={{ fontSize:12 }} />
                      <Line type="monotone" dataKey="score"  name="Your Score" stroke={C.primary} strokeWidth={2.5} dot={{ fill:C.primary, r:4 }} />
                      <Line type="monotone" dataKey="target" name="Target 75%" stroke={C.error}   strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign:'center', padding:'48px 0', color:C.textSm }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>📈</div>
                    Upload marks to see your performance trend
                  </div>
                )}
              </Card>

              {/* Subject list */}
              {subj.length > 0 && (
                <Card>
                  <SLabel>Subject Breakdown</SLabel>
                  {subj.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14,
                      padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:scoreBg(s.score),
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:15,fontWeight:800,color:scoreColor(s.score),flexShrink:0 }}>
                        {gradeLabel(s.score)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:5,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.subject}</div>
                        <div style={{ height:6,background:C.border,borderRadius:3,overflow:'hidden' }}>
                          <div style={{ width:`${s.score}%`,height:'100%',
                            background:scoreColor(s.score),borderRadius:3,transition:'width 1s' }} />
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:18,fontWeight:800,color:scoreColor(s.score) }}>{s.score}%</div>
                        <div style={{ fontSize:11,color:C.textSm }}>GPA {s.gpa?.toFixed(1)}</div>
                      </div>
                      <div style={{ width:8,height:8,borderRadius:'50%',
                        background:s.status==='Pass'?C.success:C.error,flexShrink:0 }} />
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </TabPane>

          {/* ── TAB 4: Security ──────────────────────────────────────────── */}
          <TabPane tab={<span><SafetyOutlined /> Security</span>} key="4">
            <div style={{ padding:24, maxWidth:480 }}>
              <Card>
                <SLabel>Change Password</SLabel>
                <Form form={passwordForm} layout="vertical" requiredMark={false}
                  onFinish={async values => {
                    try {
                      const res = await profileService.changePassword(values);
                      if (res?.success) { message.success('Password updated!'); passwordForm.resetFields(); }
                      else message.error(res?.message || 'Failed');
                    } catch { message.error('Failed to change password'); }
                  }}>
                  {[
                    { n:'currentPassword', l:'Current Password' },
                    { n:'newPassword',     l:'New Password',     min:6 },
                    { n:'confirmPassword', l:'Confirm Password', match:true },
                  ].map(f=>(
                    <Form.Item key={f.n} name={f.n} label={<span style={{fontWeight:600,color:C.text}}>{f.l}</span>}
                      rules={[{required:true},...(f.min?[{min:f.min}]:[]),...(f.match?[({getFieldValue})=>({
                        validator(_,v){ return !v||getFieldValue('newPassword')===v?Promise.resolve():Promise.reject(new Error('Passwords do not match')); }
                      })]:[])]}
                    >
                      <Input.Password prefix={<LockOutlined />} size="large"
                        style={{ borderRadius:10, borderColor:C.border }} />
                    </Form.Item>
                  ))}
                  <Button type="primary" htmlType="submit" size="large" icon={<LockOutlined />}
                    style={{ borderRadius:10, width:'100%', fontWeight:700 }}>
                    Update Password
                  </Button>
                </Form>
              </Card>
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* ── Settings Modal ───────────────────────────────────────────────── */}
      <Modal title={<span style={{ fontWeight:700, fontSize:16 }}>⚙️ Settings</span>}
        open={settingsOpen} onCancel={()=>setSettingsOpen(false)} width={520}
        footer={[
          <Button key="close" onClick={()=>setSettingsOpen(false)}>Close</Button>,
          <Button key="save" type="primary" onClick={()=>{ message.success('Settings saved'); setSettingsOpen(false); }}>Save</Button>,
        ]}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Notifications" key="1">
            {[
              ['Email Notifications',   'Receive email updates about your performance',    true ],
              ['Push Notifications',    'Get push notifications for study reminders',      true ],
              ['Weekly Reports',        'Receive weekly performance summary',              false],
              ['Grade Alerts',          'Alert when a score drops below 50%',              true ],
            ].map(([t,d,def])=>(
              <div key={t} style={{ display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'14px 0',borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:C.text }}>{t}</div>
                  <div style={{ fontSize:12,color:C.textSm,marginTop:2 }}>{d}</div>
                </div>
                <Switch defaultChecked={def} />
              </div>
            ))}
          </TabPane>
          <TabPane tab="Privacy" key="2">
            {[
              ['Profile Visibility', 'Make your profile visible to others', true],
              ['Share Performance',  'Allow analytics to use your data',    false],
            ].map(([t,d,def])=>(
              <div key={t} style={{ display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'14px 0',borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:C.text }}>{t}</div>
                  <div style={{ fontSize:12,color:C.textSm,marginTop:2 }}>{d}</div>
                </div>
                <Switch defaultChecked={def} />
              </div>
            ))}
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default ProfilePage;