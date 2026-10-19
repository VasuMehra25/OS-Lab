// POSIX File Permissions & Access Control Engine

export const SIMULATED_USERS = [
  { id: 'alice', name: 'Alice (Owner / Dev Lead)', groups: ['developers', 'staff'], isSuperuser: false, color: '#8468E8' },
  { id: 'bob', name: 'Bob (Developer Group Member)', groups: ['developers'], isSuperuser: false, color: '#4878DF' },
  { id: 'charlie', name: 'Charlie (Guest / Other)', groups: ['guests'], isSuperuser: false, color: '#E8773E' },
  { id: 'root', name: 'root (Superuser)', groups: ['wheel', 'root'], isSuperuser: true, color: '#DB5483' },
];

export const INITIAL_FILES = [
  {
    id: 'f1',
    name: 'server_config.yaml',
    owner: 'alice',
    group: 'developers',
    sizeKb: 14,
    permissions: {
      owner: { r: true, w: true, x: false },
      group: { r: true, w: false, x: false },
      others: { r: false, w: false, x: false },
    },
  },
  {
    id: 'f2',
    name: 'run_benchmark.sh',
    owner: 'alice',
    group: 'developers',
    sizeKb: 32,
    permissions: {
      owner: { r: true, w: true, x: true },
      group: { r: true, w: false, x: true },
      others: { r: true, w: false, x: true },
    },
  },
  {
    id: 'f3',
    name: 'customer_records.db',
    owner: 'root',
    group: 'developers',
    sizeKb: 4096,
    permissions: {
      owner: { r: true, w: true, x: false },
      group: { r: false, w: false, x: false },
      others: { r: false, w: false, x: false },
    },
  },
];

export function permissionsToOctal(perms) {
  const calc = (p) => (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
  return `${calc(perms.owner)}${calc(perms.group)}${calc(perms.others)}`;
}

export function permissionsToString(perms) {
  const part = (p) => `${p.r ? 'r' : '-'}${p.w ? 'w' : '-'}${p.x ? 'x' : '-'}`;
  return `${part(perms.owner)}${part(perms.group)}${part(perms.others)}`;
}

export function evaluateAccess(user, file, action) {
  // action is 'r', 'w', or 'x'
  const actionLabel = action === 'r' ? 'READ' : action === 'w' ? 'WRITE' : 'EXECUTE';

  // 1. Superuser bypass
  if (user.isSuperuser) {
    return {
      allowed: true,
      decisionTier: 'Superuser (root)',
      ruleExplanation: 'Root UID 0 bypasses standard POSIX DAC permission bit checks.',
    };
  }

  // 2. Owner tier check
  if (user.id === file.owner) {
    const isAllowed = file.permissions.owner[action];
    return {
      allowed: isAllowed,
      decisionTier: 'Owner (User)',
      ruleExplanation: isAllowed
        ? `User is the file Owner ("${file.owner}") and the Owner ${actionLabel} bit is ENABLED.`
        : `User is the file Owner ("${file.owner}"), but the Owner ${actionLabel} bit is DISABLED.`,
    };
  }

  // 3. Group tier check
  const inGroup = user.groups.includes(file.group);
  if (inGroup) {
    const isAllowed = file.permissions.group[action];
    return {
      allowed: isAllowed,
      decisionTier: 'Group Membership',
      ruleExplanation: isAllowed
        ? `User is a member of file group "${file.group}" and Group ${actionLabel} bit is ENABLED.`
        : `User is in group "${file.group}", but the Group ${actionLabel} bit is DISABLED.`,
    };
  }

  // 4. Others tier check
  const isAllowed = file.permissions.others[action];
  return {
    allowed: isAllowed,
    decisionTier: 'Others (World)',
    ruleExplanation: isAllowed
      ? `User is neither Owner nor in Group. The Others ${actionLabel} bit is ENABLED.`
      : `User is neither Owner nor in Group, and the Others ${actionLabel} bit is DISABLED. Access denied.`,
  };
}

export function getInitialPermissionsSnapshot() {
  const initialUser = SIMULATED_USERS[0]; // Alice
  const initialFile = INITIAL_FILES[0]; // server_config.yaml
  const initialAction = 'r';
  const evalResult = evaluateAccess(initialUser, initialFile, initialAction);

  return {
    state: {
      files: INITIAL_FILES.map((f) => ({
        ...f,
        permissions: {
          owner: { ...f.permissions.owner },
          group: { ...f.permissions.group },
          others: { ...f.permissions.others },
        },
      })),
      selectedFileId: initialFile.id,
      selectedUserId: initialUser.id,
      selectedAction: initialAction,
      evalResult,
      demoStep: 0,
    },
    stepNumber: 1,
    action: 'Access Check Initialized',
    explanation: {
      what: `Checked whether ${initialUser.name} can READ "${initialFile.name}".`,
      why: 'Whenever an application issues open(), read(), or execve() system calls, the operating system evaluates DAC security bits.',
      changed: `Evaluation result: ${evalResult.allowed ? 'GRANTED' : 'DENIED'} (${evalResult.decisionTier}).`,
      learned: 'POSIX access control evaluates Owner first, Group second, and Others third. Once a tier matches, lower tiers are completely ignored.',
    },
  };
}

export function runAccessTest(currentSnapshot, userId, fileId, action) {
  const { state } = currentSnapshot;
  const user = SIMULATED_USERS.find((u) => u.id === userId) || SIMULATED_USERS[0];
  const file = state.files.find((f) => f.id === fileId) || state.files[0];
  const evalResult = evaluateAccess(user, file, action);
  const actionLabel = action === 'r' ? 'READ' : action === 'w' ? 'WRITE' : 'EXECUTE';

  return {
    state: {
      ...state,
      selectedUserId: userId,
      selectedFileId: fileId,
      selectedAction: action,
      evalResult,
    },
    action: `${evalResult.allowed ? 'GRANTED' : 'DENIED'}: ${user.id} -> ${actionLabel}`,
    explanation: {
      what: `Access test: ${user.name} requesting to ${actionLabel} "${file.name}".`,
      why: evalResult.ruleExplanation,
      changed: `Access decision: ${evalResult.allowed ? 'ACCESS GRANTED' : 'PERMISSION DENIED'}. Tier: ${evalResult.decisionTier}.`,
      learned: 'Security is enforced at the system call layer before any disk block reads occur.',
    },
  };
}

export function togglePermissionBit(currentSnapshot, fileId, tier, bit) {
  const { state } = currentSnapshot;
  const files = state.files.map((f) => {
    if (f.id !== fileId) return f;
    return {
      ...f,
      permissions: {
        ...f.permissions,
        [tier]: {
          ...f.permissions[tier],
          [bit]: !f.permissions[tier][bit],
        },
      },
    };
  });

  const updatedFile = files.find((f) => f.id === fileId);
  const user = SIMULATED_USERS.find((u) => u.id === state.selectedUserId);
  const evalResult = evaluateAccess(user, updatedFile, state.selectedAction);

  const octal = permissionsToOctal(updatedFile.permissions);
  const str = permissionsToString(updatedFile.permissions);

  return {
    state: {
      ...state,
      files,
      evalResult,
    },
    action: `chmod: ${str} (${octal})`,
    explanation: {
      what: `Modified ${tier} permission bit "${bit}" on "${updatedFile.name}". New mode: ${str} (${octal}).`,
      why: 'System administrators use chmod to grant or revoke specific privileges to files.',
      changed: `Permission string updated to ${str}. Immediate access re-evaluated for current user.`,
      learned: 'chmod changes metadata in the file inode without affecting the actual file payload contents.',
    },
  };
}

export function getNextPermissionsStep(currentSnapshot) {
  const step = currentSnapshot.state.demoStep || 0;

  // Curriculum demonstration sequence:
  // 1: Alice (Owner) writes server_config.yaml -> GRANTED
  // 2: Bob (Group) reads server_config.yaml -> GRANTED
  // 3: Bob (Group) writes server_config.yaml -> DENIED
  // 4: Charlie (Other) reads server_config.yaml -> DENIED
  // 5: Charlie (Other) executes run_benchmark.sh -> GRANTED (755)
  // 6: Charlie (Other) writes run_benchmark.sh -> DENIED
  // 7: root accesses customer_records.db -> GRANTED (root bypass)

  const scenarios = [
    { user: 'alice', file: 'f1', action: 'w' },
    { user: 'bob', file: 'f1', action: 'r' },
    { user: 'bob', file: 'f1', action: 'w' },
    { user: 'charlie', file: 'f1', action: 'r' },
    { user: 'charlie', file: 'f2', action: 'x' },
    { user: 'charlie', file: 'f2', action: 'w' },
    { user: 'root', file: 'f3', action: 'w' },
  ];

  const target = scenarios[step % scenarios.length];
  const snap = runAccessTest(currentSnapshot, target.user, target.file, target.action);
  snap.state.demoStep = (step + 1) % scenarios.length;
  return snap;
}
