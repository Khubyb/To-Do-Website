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

function Task({ task, onToggle, onDelete }){
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
      <button
        className={"check" + (checked ? " done" : "")}
        onClick={handleToggle}
        aria-label={checked ? "Mark as not done" : "Mark as done"}
      >
        {checked && <CheckIcon />}
      </button>
      <div className="task-body">
        <div className={"task-text" + (checked ? " done" : "")}>{task.text}</div>
        <div className="task-meta">
          <span className="task-time">added {timeAgo(task.created)}</span>
          {due && <span className={"due " + due.state}>{due.label}</span>}
          {task.dueTime && <span className="due-time">{formatTime(task.dueTime)}</span>}
        </div>
      </div>
      <button className="del-btn" onClick={handleDelete} aria-label="Delete task">
        <TrashIcon />
      </button>
    </li>
  );
}

/* ---------------- main to-do screen ---------------- */

function TodoScreen({ username, theme, onToggleTheme, onLogout }){
  const [tasks, setTasks] = useState(() => loadTasks(username));
  const [filter, setFilter] = useState("active");
  const [showAdd, setShowAdd] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const modalTextRef = useRef(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const account = useMemo(() => {
    const users = loadUsers();
    const acc = users[username];
    if(acc && typeof acc === "object") return acc;
    return { firstName: username, lastName: "", email: "" };
  }, [username, showSidebar]);

  const displayName = account.firstName || username;
  const initials = ((account.firstName ? account.firstName[0] : username[0]) +
    (account.lastName ? account.lastName[0] : "")).toUpperCase();

  const openSidebar = () => setShowSidebar(true);
  const closeSidebar = () => {
    setShowSidebar(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPwError("");
    setPwSuccess("");
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
    setPwSuccess("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  useEffect(() => { saveTasks(username, tasks); }, [tasks, username]);

  useEffect(() => {
    if(showAdd){
      setTimeout(() => modalTextRef.current && modalTextRef.current.focus(), 60);
    }
  }, [showAdd]);

  const openAdd = () => setShowAdd(true);
  const closeAdd = () => {
    setShowAdd(false);
    setModalText("");
    setModalDate("");
    setModalTime("");
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
    };
    setTasks(prev => [newTask, ...prev]);
    closeAdd();
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };
  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.done));
  };

  const visible = useMemo(() => {
    let list = filter === "completed" ? tasks.filter(t => t.done) : tasks.filter(t => !t.done);

    return [...list].sort((a, b) => {
      if(a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if(a.dueDate && !b.dueDate) return -1;
      if(!a.dueDate && b.dueDate) return 1;
      return 0;
    });
  }, [tasks, filter]);

  const remaining = tasks.filter(t => !t.done).length;

  return (
    <div className="app">
      <div className="masthead">
        <div className="masthead-left">
          <button className="theme-toggle" onClick={openSidebar} aria-label="Open menu">
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
            <div className="filters">
              <button className={filter==="active" ? "active":""} onClick={() => setFilter("active")}>Active</button>
              <button className={filter==="completed" ? "active":""} onClick={() => setFilter("completed")}>Completed</button>
            </div>
            <div className="count"><b>{remaining}</b> remaining</div>
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <div className="quill">
                {tasks.length === 0 ? "A blank page." : "Nothing here for this view."}
              </div>
              <small>{tasks.length === 0 ? "Add your first task above." : "Try a different filter."}</small>
            </div>
          ) : (
            <ul className="list">
              {visible.map(t => (
                <Task key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
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
              <button type="button" className="modal-cancel" onClick={closeAdd}>Cancel</button>
              <button type="button" className="modal-submit" onClick={submitTask} disabled={!modalText.trim()}>Add task</button>
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <div className="drawer-overlay" onClick={closeSidebar}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
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

            <div className="drawer-section">
              <h4>Profile</h4>
              <div className="drawer-info-row">
                <span>First name</span>
                <span>{account.firstName || "—"}</span>
              </div>
              <div className="drawer-info-row">
                <span>Last name</span>
                <span>{account.lastName || "—"}</span>
              </div>
              <div className="drawer-info-row">
                <span>Email</span>
                <span>{account.email || "—"}</span>
              </div>
            </div>

            <div className="drawer-section">
              <h4>Change password</h4>
              <form onSubmit={changePassword} className="drawer-form">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
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
                <button type="submit" className="drawer-submit">Update password</button>
              </form>
            </div>

            <div className="drawer-section">
              <h4>Settings</h4>
              <button className="drawer-row-btn" onClick={onToggleTheme}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </button>
              <button className="drawer-row-btn danger" onClick={onLogout}>
                <LogoutIcon />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
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

  return (
    <div key={session ? "app" : "auth"} className="screen-transition">
      {session ? (
        <TodoScreen username={session} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
