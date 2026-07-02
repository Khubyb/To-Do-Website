const { useState, useEffect, useRef, useMemo } = React;

const USERS_KEY = "field-notes-users";
const SESSION_KEY = "field-notes-session";
const THEME_KEY = "field-notes-theme";
const PRIORITIES = ["low", "medium", "high"];
const DEFAULT_CATEGORIES = ["personal", "work", "errands"];

/* ---------------- storage helpers ---------------- */

function loadUsers(){
  try{
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveUsers(users){
  try{ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }catch(e){}
}

function loadSession(){
  try{ return localStorage.getItem(SESSION_KEY) || null; }catch(e){ return null; }
}
function saveSession(username){
  try{
    if(username) localStorage.setItem(SESSION_KEY, username);
    else localStorage.removeItem(SESSION_KEY);
  }catch(e){}
}

function tasksKey(username){ return "field-notes-todos-" + username; }
function loadTasks(username){
  try{
    const raw = localStorage.getItem(tasksKey(username));
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveTasks(username, tasks){
  try{ localStorage.setItem(tasksKey(username), JSON.stringify(tasks)); }catch(e){}
}

function projectsKey(username){ return "field-notes-project-" + username; }
function loadProject(username){
  try{
    const raw = localStorage.getItem(projectsKey(username));
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveProject(username, project){
  try{
    if(project){
      localStorage.setItem(projectsKey(username), JSON.stringify(project));
    }else{
      localStorage.removeItem(projectsKey(username));
    }
  }catch(e){}
}

function renameUserKey(oldName, newName){
  const users = loadUsers();
  if(!(oldName in users)) return false;
  if(newName in users) return false;
  users[newName] = users[oldName];
  delete users[oldName];
  saveUsers(users);
  try{
    const raw = localStorage.getItem(tasksKey(oldName));
    if(raw != null){
      localStorage.setItem(tasksKey(newName), raw);
      localStorage.removeItem(tasksKey(oldName));
    }
  }catch(e){}
  return true;
}

function loadTheme(){
  try{ return localStorage.getItem(THEME_KEY) || "dark"; }catch(e){ return "dark"; }
}
function saveTheme(theme){
  try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
}

/* ---------------- small helpers ---------------- */

function timeAgo(ts){
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month:"short", day:"numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
}

function dueInfo(dueDate, done){
  if(!dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due - today) / 86400000);

  let label, state = "";
  if(diffDays === 0){ label = "due today"; state = "today"; }
  else if(diffDays === 1){ label = "due tomorrow"; }
  else if(diffDays === -1){ label = "1 day overdue"; state = "overdue"; }
  else if(diffDays < 0){ label = Math.abs(diffDays) + " days overdue"; state = "overdue"; }
  else { label = "due " + due.toLocaleDateString(undefined, { month:"short", day:"numeric" }); }

  if(done) state = "";
  return { label, state };
}

function todayDateStr(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function formatTime(timeStr){
  if(!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return hour12 + ":" + String(m).padStart(2, "0") + " " + period;
}

/* ---------------- icons ---------------- */

function CheckIcon(){
  return (
    <svg viewBox="0 0 16 16">
      <polyline points="3,8.5 6.5,12 13,4" />
    </svg>
  );
}
function TrashIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16" />
      <path d="M9 6V4h6v2" />
      <path d="M6 6l1 14h10l1-14" />
    </svg>
  );
}
function EditIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h5l11-11a2 2 0 0 0-5-5L3 16v5z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}
function SunIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  );
}
function MoonIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a7 7 0 0 0 10.2 10.2Z" />
    </svg>
  );
}
function LogoutIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9" />
      <path d="M20 12H10M20 12l-3.5-3.5M20 12l-3.5 3.5" />
    </svg>
  );
}
function UserIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}
function LockIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  );
}
function MenuIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function MailIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}
function GearIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.6 6.4l-1.55 1.55M7.95 16.05L6.4 17.6M17.6 17.6l-1.55-1.55M7.95 7.95L6.4 6.4" />
    </svg>
  );
}
function BackIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function ListIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="3.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CalendarIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}
function CheckSquareIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.2" />
      <polyline points="8,12.5 11,15.5 16.5,9.5" />
    </svg>
  );
}
function LayersIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M3.5 12.5L12 17l8.5-4.5" />
      <path d="M3.5 16.5L12 21l8.5-4.5" />
    </svg>
  );
}
function FolderIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.7a1.5 1.5 0 0 1 1.5-1.5h4.1l2 2.1H19a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  );
}
function TagIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.6 3.5H6.2a1 1 0 0 0-1 1v6.4a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l6.4-6.4a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3z" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function DoneIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <polyline points="8,12.3 11,15.3 16,9.3" />
    </svg>
  );
}
function HandIcon(){
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.2V6.3a1.4 1.4 0 0 1 2.8 0V12" />
      <path d="M10.8 12V4.8a1.4 1.4 0 0 1 2.8 0V12" />
      <path d="M13.6 12V6a1.4 1.4 0 0 1 2.8 0v7.2" />
      <path d="M16.4 10.6a1.4 1.4 0 0 1 2.8 0v4.4c0 3.5-2.3 5.9-5.9 5.9h-.9c-2.1 0-3.3-.6-4.5-2L5.2 15c-.6-.8-.4-1.7.3-2.2.7-.5 1.6-.4 2.2.3l1.3 1.5" />
    </svg>
  );
}

/* ---------------- mascot ---------------- */

function BotCharacter({ covering, waving }){
  return (
    <div className={"bot-character" + (waving ? " waving" : "")} aria-hidden="true">
      <svg viewBox="0 0 140 150" className="bot-svg">
        <defs>
          <linearGradient id="botGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--logo-a)" />
            <stop offset="100%" stopColor="var(--logo-b)" />
          </linearGradient>
        </defs>

        <ellipse cx="70" cy="138" rx="34" ry="6" className="bot-shadow" />

        <line x1="70" y1="20" x2="70" y2="6" stroke="var(--logo-b)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="70" cy="6" r="5" fill="url(#botGrad)" className="bot-antenna-ball" />

        <rect x="34" y="72" width="72" height="52" rx="22" fill="url(#botGrad)" />

        <g className={"bot-arm bot-arm-left" + (covering ? " cover" : "")}>
          <rect x="18" y="80" width="14" height="34" rx="7" fill="url(#botGrad)" />
        </g>
        <g className={"bot-arm bot-arm-right" + (covering ? " cover" : "")}>
          <rect x="108" y="80" width="14" height="34" rx="7" fill="url(#botGrad)" />
        </g>

        <circle cx="70" cy="55" r="36" fill="url(#botGrad)" />
        <rect x="43" y="42" width="54" height="30" rx="15" fill="var(--paper)" />

        <g className={"bot-eyes" + (covering ? " shut" : "")}>
          <circle cx="58" cy="57" r="5.2" fill="var(--ink)" className="bot-pupil" />
          <circle cx="82" cy="57" r="5.2" fill="var(--ink)" className="bot-pupil" />
        </g>
        <path
          className={"bot-lids" + (covering ? " show" : "")}
          d="M50 57 Q58 51 66 57 M74 57 Q82 51 90 57"
          stroke="var(--ink)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />

        <path
          className={"bot-mouth" + (covering ? " shy" : "")}
          d={covering ? "M62 65 Q70 63 78 65" : "M60 64 Q70 71 80 64"}
          stroke="var(--ink)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="47" cy="64" r="3.4" className="bot-blush" />
        <circle cx="93" cy="64" r="3.4" className="bot-blush" />
      </svg>
    </div>
  );
}

/* ---------------- auth screen ---------------- */

const GMAIL_RE = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

function AuthScreen({ onLogin, theme, onToggleTheme }){
  const [mode, setMode] = useState("login"); // login | signup
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fail = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    const users = loadUsers();

    if(!name || !password){
      fail("Enter a username and password.");
      return;
    }

    if(mode === "login"){
      if(!(name in users)){
        fail("No account with that username. Try signing up instead.");
        return;
      }
      const account = users[name];
      const storedPassword = typeof account === "string" ? account : account.password;
      if(storedPassword !== password){
        fail("Incorrect password.");
        return;
      }
      onLogin(name);
    } else {
      const first = firstName.trim();
      const last = lastName.trim();
      const mail = email.trim();

      if(name.length < 3){
        fail("Username should be at least 3 characters.");
        return;
      }
      if(name in users){
        fail("That username is already taken. Try logging in instead.");
        return;
      }
      if(!first || !last){
        fail("Enter your first and last name.");
        return;
      }
      if(!GMAIL_RE.test(mail)){
        fail("Email must be a valid address ending in @gmail.com.");
        return;
      }
      if(password.length < 4){
        fail("Password should be at least 4 characters.");
        return;
      }
      if(password !== confirm){
        fail("Passwords don't match.");
        return;
      }
      users[name] = { password, firstName: first, lastName: last, email: mail };
      saveUsers(users);
      onLogin(name);
    }
  };

  return (
    <div className="auth-screen">
      <button className="theme-toggle auth-theme-toggle" onClick={onToggleTheme} aria-label="Toggle light or dark mode">
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="auth-stage">
        <BotCharacter covering={passwordFocused} />

        <div className={"auth-card" + (shake ? " shake" : "")}>
          <div className="auth-brand">
            <img src="logo.png" alt="TODO logo" className="auth-logo" />
            <span className="auth-brand-name">TODO</span>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >Log in</button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >Sign up</button>
            <span className={"tab-indicator " + mode}></span>
          </div>

          <p className="auth-sub">
            {mode === "login" ? "Welcome back — pick up where you left off." : "Set up an account to keep your list saved."}
          </p>

          <form onSubmit={handleSubmit} key={mode} className="auth-form">
          {mode === "signup" && (
            <div className="input-row-pair">
              <div className="input-row">
                <UserIcon />
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  maxLength={40}
                />
              </div>
              <div className="input-row">
                <UserIcon />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                  maxLength={40}
                />
              </div>
            </div>
          )}

          <div className="input-row">
            <UserIcon />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              maxLength={24}
            />
          </div>

          {mode === "signup" && (
            <div className="input-row">
              <MailIcon />
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={80}
              />
            </div>
          )}

          <div className="input-row">
            <LockIcon />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              maxLength={64}
            />
          </div>

          {mode === "signup" && (
            <div className="input-row">
              <LockIcon />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                autoComplete="new-password"
                maxLength={64}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit">
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- task row ---------------- */

function Task({ task, index, onToggle, onDelete, onEdit }){
  const [leaving, setLeaving] = useState(false);
  const [checked, setChecked] = useState(task.done);
  const due = dueInfo(task.dueDate, task.done);

  const handleDelete = () => {
    setLeaving(true);
    setTimeout(() => onDelete(task.id), 300);
  };

  const handleToggle = () => {
    setChecked(c => !c);
    setLeaving(true);
    setTimeout(() => onToggle(task.id), 280);
  };

  return (
    <li className={"task p-" + task.priority + (leaving ? " leaving" : "")}>
      {index != null && <span className="task-number">{index}</span>}
      <button
        className={"check" + (checked ? " done" : "")}
        onClick={handleToggle}
        aria-label={checked ? "Mark as not done" : "Mark as done"}
      >
        {checked && <CheckIcon />}
      </button>
      <div className="task-body">
        <div className={"task-text" + (checked ? " done" : "")}>
          {task.label && <span className="task-label-flag" aria-label="Labeled task"><HandIcon /></span>}
          {task.text}
        </div>
        <div className="task-meta">
          <span className="task-time">added {timeAgo(task.created)}</span>
          {due && <span className={"due " + due.state}>{due.label}</span>}
          {task.dueTime && <span className="due-time">{formatTime(task.dueTime)}</span>}
        </div>
      </div>
      <div className="task-actions">
        <button className="edit-btn" onClick={() => onEdit(task)} aria-label="Edit task">
          <EditIcon />
        </button>
        <button className="del-btn" onClick={handleDelete} aria-label="Delete task">
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

/* ---------------- main to-do screen ---------------- */

function TodoScreen({ username, theme, onToggleTheme, onLogout, onUsernameChange }){
  const [tasks, setTasks] = useState(() => loadTasks(username));
  const [showAdd, setShowAdd] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalIsLabel, setModalIsLabel] = useState(false);
  const modalTextRef = useRef(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskTime, setEditTaskTime] = useState("");

  const [showLabelPopup, setShowLabelPopup] = useState(false);
  const labelPopupTasks = useMemo(() => tasks.filter(t => t.label && !t.done), [tasks]);

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu");
  const [sidebarOpenCount, setSidebarOpenCount] = useState(0);
  const [navView, setNavView] = useState("all");
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [savedProject, setSavedProject] = useState(() => loadProject(username));
  const [projectScreen, setProjectScreen] = useState(() => {
    const proj = loadProject(username);
    return proj ? "choose" : "create"; // choose | create | view
  });

  const [projectMemberCount, setProjectMemberCount] = useState(2);
  const [projectLeaderIndex, setProjectLeaderIndex] = useState(0);
  const [projectError, setProjectError] = useState("");
  const [projectMembers, setProjectMembers] = useState(() =>
    Array.from({ length: 2 }, () => ({ name: "", task: "" }))
  );

  const pushToast = (message, kind = "added") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, kind }]);
    toastTimers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete toastTimers.current[id];
    }, 3000);
  };

  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, []);

  const [accountVersion, setAccountVersion] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const [editUsername, setEditUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  const [editEmail, setEditEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const [showUsernameFields, setShowUsernameFields] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);


  const account = useMemo(() => {
    const users = loadUsers();
    const acc = users[username];
    if(acc && typeof acc === "object") return acc;
    return { firstName: username, lastName: "", email: "" };
  }, [username, accountVersion]);

  useEffect(() => {
    setEditUsername("");
    setEditEmail(account.email || "");
  }, [username, accountVersion]);

  const displayName = account.firstName || username;
  const initials = ((account.firstName ? account.firstName[0] : username[0]) +
    (account.lastName ? account.lastName[0] : "")).toUpperCase();

  const openSidebar = () => {
    setShowSidebar(true);
    setSidebarOpenCount(c => c + 1);
  };

  const resetProjectForm = (count = 2) => {
    setProjectError("");
    setProjectMemberCount(count);
    setProjectLeaderIndex(0);
    setProjectMembers(Array.from({ length: count }, () => ({ name: "", task: "" })));
  };

  const openProjectsModal = () => {
    const proj = loadProject(username);
    setSavedProject(proj);
    setProjectError("");
    setProjectScreen(proj ? "choose" : "create");
    if(!proj) resetProjectForm(2);
    setShowProjectModal(true);
  };

  useEffect(() => {
    // Refresh saved project + reset the form when switching users.
    const proj = loadProject(username);
    setSavedProject(proj);
    setProjectError("");
    setProjectScreen(proj ? "choose" : "create");
    setShowProjectModal(false);
    resetProjectForm(2);
  }, [username]);

  const handleNavClick = (key) => {
    if(key === "projects"){
      closeSidebar();
      openProjectsModal();
      return;
    }
    if(key === "settings" || key === "labels"){
      setSidebarView(key);
      return;
    }
    setNavView(key);
    closeSidebar();
  };
  const closeSidebar = () => {
    setShowSidebar(false);
    setSidebarView("menu");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPwError("");
    setPwSuccess("");
    setUsernameError("");
    setUsernameSuccess("");
    setEmailError("");
    setEmailSuccess("");
    setShowUsernameFields(false);
    setShowEmailFields(false);
    setShowPasswordFields(false);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
  };

  const showCreateProject = () => {
    setProjectError("");
    setProjectScreen("create");
    resetProjectForm(2);
  };

  const showPreviousProject = () => {
    setProjectError("");
    setProjectScreen("view");
  };

  const confirmProject = () => {
    const count = Math.max(2, Math.min(10, projectMemberCount || 2));
    const leaderIndex = Math.max(0, Math.min(count - 1, projectLeaderIndex));

    const members = Array.from({ length: count }).map((_, i) => {
      const m = projectMembers[i] || { name: "", task: "" };
      return { name: (m.name || "").trim(), task: (m.task || "").trim() };
    });

    const missing = members.findIndex(m => !m.name || !m.task);
    if(missing !== -1){
      const n = missing + 1;
      setProjectError(`Please write both name and task for Member ${n}.`);
      return;
    }

    const projectData = {
      memberCount: count,
      leaderIndex,
      members,
      updatedAt: Date.now(),
    };

    saveProject(username, projectData);
    setSavedProject(projectData);
    setProjectScreen("view");
    setProjectError("");
    pushToast("Project saved", "added");
  };

  const handleProjectCountChange = (value) => {
    let n = parseInt(value, 10);
    if(isNaN(n)) n = 2;
    if(n < 2) n = 2;
    if(n > 10) n = 10;
    setProjectError("");
    setProjectMemberCount(n);
    setProjectMembers(prev => {
      const next = [...prev];
      while(next.length < n) next.push({ name: "", task: "" });
      return next.slice(0, n);
    });
    setProjectLeaderIndex(i => (i >= n ? 0 : i));
  };

  const updateProjectMember = (index, field, value) => {
    setProjectMembers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setProjectError("");
  };

  const changePassword = (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    const users = loadUsers();
    const acc = users[username];
    const storedPassword = acc && typeof acc === "object" ? acc.password : acc;

    if(!currentPassword || storedPassword !== currentPassword){
      setPwError("Current password is incorrect.");
      return;
    }
    if(newPassword.length < 4){
      setPwError("New password should be at least 4 characters.");
      return;
    }
    if(newPassword !== confirmNewPassword){
      setPwError("New passwords don't match.");
      return;
    }
    const base = acc && typeof acc === "object" ? acc : {};
    users[username] = { ...base, password: newPassword };
    saveUsers(users);
    setAccountVersion(v => v + 1);
    setPwSuccess("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const changeUsername = (e) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");
    const next = editUsername.trim();

    if(next.length < 3){
      setUsernameError("Username should be at least 3 characters.");
      return;
    }
    if(next === username){
      setUsernameError("That's already your username.");
      return;
    }
    const users = loadUsers();
    if(next in users){
      setUsernameError("That username is already taken.");
      return;
    }
    const ok = renameUserKey(username, next);
    if(!ok){
      setUsernameError("Couldn't update username. Try again.");
      return;
    }
    saveSession(next);
    setUsernameSuccess("Username updated.");
    setAccountVersion(v => v + 1);
    if(onUsernameChange) onUsernameChange(next);
  };

  const changeEmail = (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    const next = editEmail.trim();

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)){
      setEmailError("Please enter a valid email address.");
      return;
    }
    const users = loadUsers();
    const acc = users[username];
    const base = acc && typeof acc === "object" ? acc : {};
    users[username] = { ...base, email: next };
    saveUsers(users);
    setAccountVersion(v => v + 1);
    setEmailSuccess("Email updated.");
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text || "");
    setEditTaskTime(task.dueTime || "");
    setShowEditTaskModal(true);
  };

  const closeEditTask = () => {
    setShowEditTaskModal(false);
    setEditingTaskId(null);
    setEditTaskText("");
    setEditTaskTime("");
  };

  const saveTaskEdit = () => {
    const nextText = editTaskText.trim();
    if(!editingTaskId || !nextText) return;
    setTasks(prev => prev.map(t => {
      if(t.id !== editingTaskId) return t;
      return { ...t, text: nextText, dueTime: editTaskTime || null };
    }));
    pushToast("Task updated", "added");
    closeEditTask();
  };

  useEffect(() => { saveTasks(username, tasks); }, [tasks, username]);

  useEffect(() => {
    if(showAdd){
      setTimeout(() => modalTextRef.current && modalTextRef.current.focus(), 60);
    }
  }, [showAdd]);

  // every time the app is opened, resurface any labeled tasks as a reminder popup
  useEffect(() => {
    const initial = loadTasks(username).filter(t => t.label && !t.done);
    if(initial.length > 0){
      const timer = setTimeout(() => setShowLabelPopup(true), 400);
      return () => clearTimeout(timer);
    }
  }, [username]);

  const openAdd = () => setShowAdd(true);
  const closeAdd = () => {
    setShowAdd(false);
    setModalText("");
    setModalDate("");
    setModalTime("");
    setModalIsLabel(false);
  };

  const submitTask = () => {
    const text = modalText.trim();
    if(!text) return;
    const newTask = {
      id: Date.now() + Math.random(),
      text,
      done: false,
      created: Date.now(),
      dueDate: modalDate || null,
      dueTime: modalTime || null,
      priority: "medium",
      category: null,
      label: modalIsLabel,
    };
    setTasks(prev => [newTask, ...prev]);
    pushToast(modalIsLabel ? "Task added to labels" : "Task added", "added");
    closeAdd();
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if(t.id !== id) return t;
      const next = { ...t, done: !t.done };
      pushToast(next.done ? "Task completed" : "Task marked active", next.done ? "added" : "removed");
      return next;
    }));
  };
  const deleteTask = (id) => {
    const target = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    pushToast(target ? `"${target.text.slice(0, 40)}" removed` : "Task removed", "removed");
  };
  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.done));
    pushToast("Completed tasks cleared", "removed");
  };

  const visible = useMemo(() => {
    const todayStr = todayDateStr();
    let base = tasks;
    if(navView === "today") base = tasks.filter(t => t.dueDate === todayStr);
    else if(navView === "upcoming") base = tasks.filter(t => t.dueDate && t.dueDate > todayStr);

    let list = navView === "completed" ? base.filter(t => t.done) : base.filter(t => !t.done);

    return [...list].sort((a, b) => {
      if(a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if(a.dueDate && !b.dueDate) return -1;
      if(!a.dueDate && b.dueDate) return 1;
      return 0;
    });
  }, [tasks, navView]);

  const navTitle = navView === "today" ? "Today"
    : navView === "upcoming" ? "Upcoming"
    : navView === "completed" ? "Completed"
    : "All Tasks";

  const remaining = tasks.filter(t => !t.done).length;

  const { todayCount, upcomingCount, completedCount } = useMemo(() => {
    const todayStr = todayDateStr();
    let today = 0, upcoming = 0, completed = 0;
    tasks.forEach(t => {
      if(t.done){ completed++; return; }
      if(!t.dueDate) return;
      if(t.dueDate === todayStr) today++;
      else if(t.dueDate > todayStr) upcoming++;
    });
    return { todayCount: today, upcomingCount: upcoming, completedCount: completed };
  }, [tasks]);

  return (
    <div className="app">
      <div className="toast-stack" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={"toast" + (t.kind === "removed" ? " removed" : "")}>
            <span className="toast-icon">{t.kind === "removed" ? <CloseIcon /> : <CheckIcon />}</span>
            <span className="toast-text">{t.message}</span>
          </div>
        ))}
      </div>

      <div className={"sidebar-overlay" + (showSidebar ? " show" : "")} onClick={closeSidebar}></div>

      <div className={"sidebar" + (showSidebar ? " open" : "")}>
        <button className="drawer-close" onClick={closeSidebar} aria-label="Close menu">
          <CloseIcon />
        </button>

        <div className="drawer-header">
          <div className="drawer-avatar">{initials || "?"}</div>
          <div>
            <div className="drawer-name">{account.firstName} {account.lastName}</div>
            <div className="drawer-username">@{username}</div>
          </div>
        </div>

        {sidebarView === "menu" ? (
          <React.Fragment>
            <nav className="sidebar-nav" key={sidebarOpenCount}>
              {[
                { key: "today", label: "Today", icon: <CheckSquareIcon />, count: todayCount },
                { key: "upcoming", label: "Upcoming", icon: <CalendarIcon />, count: upcomingCount },
                { key: "completed", label: "Completed", icon: <DoneIcon />, count: completedCount },
                { key: "all", label: "All Tasks", icon: <LayersIcon />, count: tasks.length },
                { key: "projects", label: "Projects", icon: <FolderIcon /> },
                { key: "labels", label: "Labels", icon: <TagIcon /> },
                { key: "settings", label: "Settings", icon: <GearIcon /> },
              ].map((item, i) => (
                <button
                  key={item.key}
                  className={"nav-item" + (navView === item.key ? " active" : "")}
                  style={{ animationDelay: (i * 0.05) + "s" }}
                  onClick={() => handleNavClick(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.count != null && <span className="nav-count">{item.count}</span>}
                </button>
              ))}
            </nav>

            <div className="drawer-section">
              <button className="drawer-row-btn" onClick={onToggleTheme}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </button>
              <button className="drawer-row-btn danger" onClick={onLogout}>
                <LogoutIcon />
                Log out
              </button>
            </div>
          </React.Fragment>
        ) : sidebarView === "projects" ? (
          <React.Fragment>
            <button className="drawer-back" onClick={() => setSidebarView("menu")}>
              <BackIcon /> Back
            </button>
            <div className="drawer-section">
              <h4>Projects</h4>
              <p className="drawer-placeholder">
                Grouping tasks into projects is on the way — for now, all your tasks live under All Tasks.
              </p>
            </div>
          </React.Fragment>
        ) : sidebarView === "labels" ? (
          <React.Fragment>
            <button className="drawer-back" onClick={() => setSidebarView("menu")}>
              <BackIcon /> Back
            </button>
            <div className="drawer-section">
              <h4>Labels</h4>
              {labelPopupTasks.length === 0 ? (
                <p className="drawer-placeholder">
                  No labeled tasks yet. Tap the hand icon while adding a task to pin it here as a reminder.
                </p>
              ) : (
                <ul className="labels-list">
                  {labelPopupTasks.map(t => (
                    <li key={t.id} className="label-item">
                      <span className="label-item-icon"><HandIcon /></span>
                      <span className="label-item-text">{t.text}</span>
                      <button
                        className="label-item-check"
                        onClick={() => toggleTask(t.id)}
                        aria-label="Mark as done"
                      >
                        <CheckIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button className="drawer-back" onClick={() => setSidebarView("menu")}>
              <BackIcon /> Back
            </button>

            <div className="drawer-section">
              <h4>Username</h4>
              {!showUsernameFields ? (
                <button className="drawer-row-btn accent" onClick={() => setShowUsernameFields(true)}>
                  <UserIcon />
                  Update username
                </button>
              ) : (
                <form onSubmit={changeUsername} className="drawer-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={editUsername || username}
                    onChange={e => { setEditUsername(e.target.value); setUsernameError(""); setUsernameSuccess(""); }}
                    autoComplete="username"
                    maxLength={24}
                    autoFocus
                  />
                  {usernameError && <div className="drawer-error">{usernameError}</div>}
                  {usernameSuccess && <div className="drawer-success">{usernameSuccess}</div>}
                  <button type="submit" className="drawer-submit">Confirm</button>
                </form>
              )}
            </div>

            <div className="drawer-section">
              <h4>Email</h4>
              {!showEmailFields ? (
                <button className="drawer-row-btn accent" onClick={() => setShowEmailFields(true)}>
                  <MailIcon />
                  Update email
                </button>
              ) : (
                <form onSubmit={changeEmail} className="drawer-form">
                  <input
                    type="email"
                    placeholder="Email"
                    value={editEmail}
                    onChange={e => { setEditEmail(e.target.value); setEmailError(""); setEmailSuccess(""); }}
                    autoComplete="email"
                    autoFocus
                  />
                  {emailError && <div className="drawer-error">{emailError}</div>}
                  {emailSuccess && <div className="drawer-success">{emailSuccess}</div>}
                  <button type="submit" className="drawer-submit">Confirm</button>
                </form>
              )}
            </div>

            <div className="drawer-section">
              <h4>Change password</h4>
              {!showPasswordFields ? (
                <button className="drawer-row-btn accent" onClick={() => setShowPasswordFields(true)}>
                  <LockIcon />
                  Update password
                </button>
              ) : (
                <form onSubmit={changePassword} className="drawer-form">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {pwError && <div className="drawer-error">{pwError}</div>}
                  {pwSuccess && <div className="drawer-success">{pwSuccess}</div>}
                  <button type="submit" className="drawer-submit">Confirm</button>
                </form>
              )}
            </div>

          </React.Fragment>
        )}
      </div>

      <div className="main-content">
      <div className="masthead">
        <div className="masthead-left">
          <button className="theme-toggle sidebar-toggle" onClick={openSidebar} aria-label="Open menu">
            <MenuIcon />
          </button>
          <div className="masthead-brand">
            <img src="logo.png" alt="TODO logo" className="masthead-logo" />
            <span className="signed-in-as">{displayName}</span>
          </div>
        </div>
        <div className="masthead-actions">
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle light or dark mode">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="theme-toggle" onClick={onLogout} aria-label="Log out">
            <LogoutIcon />
          </button>
        </div>
      </div>

      <div className="notebook">
        <div className="spine">
          {Array.from({length:14}).map((_,i) => <i key={i}></i>)}
        </div>
        <div className="sheet">
          <div className="view-title">{navTitle}</div>
          <div className="composer">
            <input
              type="text"
              placeholder="Write down what needs doing…"
              value=""
              onFocus={openAdd}
              onClick={openAdd}
              readOnly
            />
            <button className="add-btn" onClick={openAdd} aria-label="Add task">+</button>
          </div>

          <div className="toolbar">
            <div className="count">
              {navView === "completed"
                ? <React.Fragment><b>{visible.length}</b> completed</React.Fragment>
                : <React.Fragment><b>{remaining}</b> remaining</React.Fragment>}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <div className="quill">
                {tasks.length === 0
                  ? "A blank page."
                  : navView === "today"
                    ? "Nothing due today."
                    : navView === "upcoming"
                      ? "Nothing coming up."
                      : "Nothing here for this view."}
              </div>
              <small>{tasks.length === 0 ? "Add your first task above." : "Try a different filter or nav item."}</small>
            </div>
          ) : (
            <ul className="list">
              {visible.map((t, i) => (
                <Task key={t.id} task={t} index={i + 1} onToggle={toggleTask} onDelete={deleteTask} onEdit={openEditTask} />
              ))}
            </ul>
          )}
        </div>

        {tasks.some(t => t.done) && (
          <div className="footer-bar">
            <button className="clear-btn" onClick={clearCompleted}>clear completed</button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if(e.key === "Escape") closeAdd(); if(e.key === "Enter" && modalText.trim()) submitTask(); }}
          >
            <h3>New task</h3>

            <label className="modal-field">
              <span>Task</span>
              <input
                ref={modalTextRef}
                type="text"
                placeholder="Write down what needs doing…"
                value={modalText}
                onChange={e => setModalText(e.target.value)}
                maxLength={200}
              />
            </label>

            <label className="modal-field">
              <span>Date</span>
              <input
                type="date"
                value={modalDate}
                onChange={e => setModalDate(e.target.value)}
              />
            </label>

            <label className="modal-field">
              <span>Time</span>
              <input
                type="time"
                value={modalTime}
                onChange={e => setModalTime(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className={"hand-btn" + (modalIsLabel ? " active" : "")}
                onClick={() => setModalIsLabel(v => !v)}
                aria-pressed={modalIsLabel}
                aria-label="Mark as label"
                title="Pin as a label — it'll pop up every time you open the app"
              >
                <HandIcon />
              </button>
              <button type="button" className="modal-cancel" onClick={closeAdd}>Cancel</button>
              <button type="button" className="modal-submit" onClick={submitTask} disabled={!modalText.trim()}>Add task</button>
            </div>
          </div>
        </div>
      )}

      {showEditTaskModal && (
        <div className="modal-overlay" onClick={closeEditTask}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if(e.key === "Escape") closeEditTask(); if(e.key === "Enter" && editTaskText.trim()) saveTaskEdit(); }}
          >
            <h3>Edit task</h3>
            <label className="modal-field">
              <span>Task text</span>
              <input
                type="text"
                placeholder="Task text"
                value={editTaskText}
                onChange={e => setEditTaskText(e.target.value)}
                maxLength={200}
              />
            </label>
            <label className="modal-field">
              <span>Time</span>
              <input
                type="time"
                value={editTaskTime}
                onChange={e => setEditTaskTime(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={closeEditTask}>Cancel</button>
              <button type="button" className="modal-submit" onClick={saveTaskEdit} disabled={!editTaskText.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showLabelPopup && (
        <div className="modal-overlay" onClick={() => setShowLabelPopup(false)}>
          <div className="modal-card label-popup" onClick={e => e.stopPropagation()}>
            <h3><span className="label-popup-icon"><HandIcon /></span> Labeled reminders</h3>
            <ul className="labels-list">
              {labelPopupTasks.map(t => (
                <li key={t.id} className="label-item">
                  <span className="label-item-icon"><HandIcon /></span>
                  <span className="label-item-text">{t.text}</span>
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button type="button" className="modal-submit" onClick={() => setShowLabelPopup(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay" onClick={closeProjectModal}>
          <div className="modal-card project-card" onClick={e => e.stopPropagation()}>
            {projectScreen === "choose" && (
              <>
                <h3>Project</h3>
                <p className="project-hint">
                  A previous project was found for <b>{username}</b>. Do you want to view it, or create a new one?
                </p>
                <div className="modal-actions">
                  <button type="button" className="modal-submit" onClick={showPreviousProject} disabled={!savedProject}>
                    View previous
                  </button>
                  <button type="button" className="modal-cancel" onClick={showCreateProject}>
                    Create new
                  </button>
                </div>
                <div className="modal-actions" style={{ marginTop: 0 }}>
                  <button type="button" className="modal-cancel" onClick={closeProjectModal}>
                    Close
                  </button>
                </div>
              </>
            )}

            {projectScreen === "view" && (
              <>
                <h3>Previous project</h3>

                {!savedProject ? (
                  <p className="project-hint">No previous project found. Create a new one instead.</p>
                ) : (
                  <div className="project-members">
                    {Array.from({ length: savedProject.memberCount || savedProject.members?.length || 0 }).map(
                      (_, index) => {
                        const m = savedProject.members?.[index] || { name: "", task: "" };
                        const isLeader = savedProject.leaderIndex === index;
                        return (
                          <div key={index} className="project-member-row">
                            <div className="project-member-header">
                              <span>
                                Member {index + 1} {isLeader ? "(Leader)" : ""}
                              </span>
                            </div>
                            <input type="text" className="project-input" readOnly value={m.name} />
                            <input type="text" className="project-input" readOnly value={m.task} />
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="modal-submit" onClick={showCreateProject}>
                    Make new
                  </button>
                  <button type="button" className="modal-cancel" onClick={closeProjectModal}>
                    Close
                  </button>
                </div>
              </>
            )}

            {projectScreen === "create" && (
              <>
                <h3>Project members</h3>

                <div className="project-field-row">
                  <div className="modal-field">
                    <span>Number of members</span>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={projectMemberCount}
                      onChange={e => handleProjectCountChange(e.target.value)}
                    />
                  </div>
                </div>

                <p className="project-hint">
                  Choose between 2 and 10 people, then pick exactly one as the project leader. Add a task for each member.
                </p>

                {projectError && <div className="auth-error project-error">{projectError}</div>}

                <div className="project-members">
                  {Array.from({ length: projectMemberCount }).map((_, index) => (
                    <div key={index} className="project-member-row">
                      <div className="project-member-header">
                        <span>Member {index + 1}</span>
                        <label className="project-leader-toggle">
                          <input
                            type="radio"
                            name="project-leader"
                            checked={projectLeaderIndex === index}
                            onChange={() => setProjectLeaderIndex(index)}
                          />
                          Leader
                        </label>
                      </div>
                      <input
                        type="text"
                        className="project-input"
                        placeholder="Member name"
                        value={projectMembers[index]?.name || ""}
                        onChange={e => updateProjectMember(index, "name", e.target.value)}
                        maxLength={60}
                      />
                      <input
                        type="text"
                        className="project-input"
                        placeholder="Task for this member"
                        value={projectMembers[index]?.task || ""}
                        onChange={e => updateProjectMember(index, "task", e.target.value)}
                        maxLength={120}
                      />
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={closeProjectModal}>
                    Close
                  </button>
                  <button type="button" className="modal-submit" onClick={confirmProject}>
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ---------------- root app: handles auth/session switching ---------------- */

function Root(){
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const handleLogin = (username) => {
    setSession(username);
  };
  const handleLogout = () => {
    setSession(null);
  };
  const handleUsernameChange = (newUsername) => {
    setSession(newUsername);
  };

  return (
    <div key={session ? "app" : "auth"} className="screen-transition">
      {session ? (
        <TodoScreen username={session} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} onUsernameChange={handleUsernameChange} />
      ) : (
        <AuthScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
