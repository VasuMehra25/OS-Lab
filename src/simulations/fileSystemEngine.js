// Virtual File System & Inode Explorer Engine

export const TOTAL_DISK_CAPACITY_KB = 10240; // 10 MB
export const TOTAL_INODES = 128;

export const INITIAL_FS_TREE = {
  id: 'root',
  name: '/',
  type: 'dir',
  inode: 1,
  sizeKb: 4,
  modified: '2026-10-19 09:00',
  children: [
    {
      id: 'bin',
      name: 'bin',
      type: 'dir',
      inode: 2,
      sizeKb: 4,
      modified: '2026-10-19 09:00',
      children: [
        { id: 'bash', name: 'sh', type: 'file', ext: 'bin', inode: 10, sizeKb: 840, modified: '2026-10-19 09:05' },
        { id: 'cat', name: 'cat', type: 'file', ext: 'bin', inode: 11, sizeKb: 128, modified: '2026-10-19 09:06' },
      ],
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      inode: 3,
      sizeKb: 4,
      modified: '2026-10-19 09:00',
      children: [
        { id: 'hosts', name: 'hosts.conf', type: 'file', ext: 'conf', inode: 20, sizeKb: 2, modified: '2026-10-19 09:10' },
      ],
    },
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      inode: 4,
      sizeKb: 4,
      modified: '2026-10-19 09:12',
      children: [
        {
          id: 'user',
          name: 'student',
          type: 'dir',
          inode: 30,
          sizeKb: 4,
          modified: '2026-10-19 09:15',
          children: [
            { id: 'doc1', name: 'os_lecture_notes.txt', type: 'file', ext: 'txt', inode: 40, sizeKb: 48, modified: '2026-10-19 09:20' },
            { id: 'doc2', name: 'diagram_memory.svg', type: 'file', ext: 'svg', inode: 41, sizeKb: 256, modified: '2026-10-19 09:22' },
          ],
        },
      ],
    },
  ],
};

function cloneTree(node) {
  const cloned = { ...node };
  if (cloned.children) {
    cloned.children = cloned.children.map(cloneTree);
  }
  return cloned;
}

function calculateFsStats(node) {
  let totalSizeKb = node.sizeKb || 0;
  let totalInodes = 1;

  if (node.children) {
    for (const child of node.children) {
      const childStats = calculateFsStats(child);
      totalSizeKb += childStats.totalSizeKb;
      totalInodes += childStats.totalInodes;
    }
  }

  return { totalSizeKb, totalInodes };
}

export function getInitialFsSnapshot() {
  const tree = cloneTree(INITIAL_FS_TREE);
  const stats = calculateFsStats(tree);

  return {
    state: {
      tree,
      selectedNodeId: 'root',
      expandedFolderIds: ['root', 'bin', 'etc', 'home', 'user'],
      nextInode: 50,
      totalCapacityKb: TOTAL_DISK_CAPACITY_KB,
      usedSizeKb: stats.totalSizeKb,
      freeSizeKb: TOTAL_DISK_CAPACITY_KB - stats.totalSizeKb,
      usedInodes: stats.totalInodes,
      totalInodes: TOTAL_INODES,
      demoStep: 0,
    },
    stepNumber: 1,
    action: 'File System Mounted',
    explanation: {
      what: 'Ext4-style virtual file system mounted at root "/" directory.',
      why: 'Operating systems organize block storage into directories and files linked via an inode table.',
      changed: 'Root directory, bin, etc, and home structures loaded with initial inodes.',
      learned: 'A directory is actually a special file that contains an index mapping names to inode numbers.',
    },
  };
}

export function createNode(currentSnapshot, parentId, name, type, sizeKb = 16) {
  const { state } = currentSnapshot;
  const newTree = cloneTree(state.tree);
  const inodeNum = state.nextInode;
  const ext = type === 'file' ? (name.includes('.') ? name.split('.').pop() : 'txt') : null;

  const newNode = {
    id: `node-${inodeNum}`,
    name,
    type,
    inode: inodeNum,
    sizeKb: type === 'dir' ? 4 : Number(sizeKb) || 16,
    ext,
    modified: 'Just now',
    ...(type === 'dir' ? { children: [] } : {}),
  };

  function insertUnder(node) {
    if (node.id === parentId && node.type === 'dir') {
      node.children = [...(node.children || []), newNode];
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (insertUnder(child)) return true;
      }
    }
    return false;
  }

  insertUnder(newTree);
  const stats = calculateFsStats(newTree);

  return {
    state: {
      ...state,
      tree: newTree,
      selectedNodeId: newNode.id,
      expandedFolderIds: Array.from(new Set([...state.expandedFolderIds, parentId])),
      nextInode: inodeNum + 1,
      usedSizeKb: stats.totalSizeKb,
      freeSizeKb: TOTAL_DISK_CAPACITY_KB - stats.totalSizeKb,
      usedInodes: stats.totalInodes,
    },
    action: `Created ${type.toUpperCase()}: ${name}`,
    explanation: {
      what: `Created ${type} "${name}" assigned to Inode #${inodeNum} with size ${newNode.sizeKb} KB.`,
      why: 'The OS allocated an unused inode entry in the superblock inode bitmap and appended an entry to the parent directory file.',
      changed: `Directory entry added under parent. Inode count incremented to ${stats.totalInodes}.`,
      learned: 'File creation requires two operations: allocating an inode record and writing a name-to-inode link into the parent directory.',
    },
  };
}

export function deleteNode(currentSnapshot, targetNodeId) {
  const { state } = currentSnapshot;
  if (targetNodeId === 'root') return currentSnapshot;

  const newTree = cloneTree(state.tree);
  let deletedNode = null;

  function removeUnder(node) {
    if (!node.children) return false;
    const index = node.children.findIndex((c) => c.id === targetNodeId);
    if (index !== -1) {
      deletedNode = node.children[index];
      node.children.splice(index, 1);
      return true;
    }
    for (const child of node.children) {
      if (removeUnder(child)) return true;
    }
    return false;
  }

  removeUnder(newTree);
  if (!deletedNode) return currentSnapshot;

  const stats = calculateFsStats(newTree);

  return {
    state: {
      ...state,
      tree: newTree,
      selectedNodeId: 'root',
      usedSizeKb: stats.totalSizeKb,
      freeSizeKb: TOTAL_DISK_CAPACITY_KB - stats.totalSizeKb,
      usedInodes: stats.totalInodes,
    },
    action: `Deleted ${deletedNode.name}`,
    explanation: {
      what: `Deleted "${deletedNode.name}" (Inode #${deletedNode.inode}).`,
      why: 'When unlink() is called, the OS removes the directory entry and marks the inode and data blocks as free in the allocation bitmap.',
      changed: `Inode #${deletedNode.inode} and ${deletedNode.sizeKb} KB of disk blocks reclaimed.`,
      learned: 'In UNIX file systems, deleting a file "unlinks" it; actual data blocks are only freed when the hard link count drops to zero.',
    },
  };
}

export function renameNode(currentSnapshot, targetNodeId, newName) {
  const { state } = currentSnapshot;
  if (targetNodeId === 'root' || !newName.trim()) return currentSnapshot;

  const newTree = cloneTree(state.tree);
  let oldName = '';

  function renameUnder(node) {
    if (node.id === targetNodeId) {
      oldName = node.name;
      node.name = newName.trim();
      if (node.type === 'file') {
        node.ext = node.name.includes('.') ? node.name.split('.').pop() : 'txt';
      }
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (renameUnder(child)) return true;
      }
    }
    return false;
  }

  renameUnder(newTree);

  return {
    state: {
      ...state,
      tree: newTree,
    },
    action: `Renamed to ${newName}`,
    explanation: {
      what: `Renamed "${oldName}" to "${newName}".`,
      why: 'Renaming updates the name string inside the parent directory table without copying or relocating disk blocks.',
      changed: `Directory entry updated. Inode number #${state.selectedNodeId} remains identical.`,
      learned: 'Renaming is an instantaneous O(1) metadata update because underlying storage blocks do not move.',
    },
  };
}

export function getNextFileSystemStep(currentSnapshot) {
  const step = currentSnapshot.state.demoStep || 0;

  switch (step) {
    case 0: {
      const snap = createNode(currentSnapshot, 'user', 'projects', 'dir', 4);
      snap.state.demoStep = 1;
      return snap;
    }
    case 1: {
      const snap = createNode(currentSnapshot, 'node-50', 'task_scheduler.c', 'file', 64);
      snap.state.demoStep = 2;
      return snap;
    }
    case 2: {
      const snap = createNode(currentSnapshot, 'node-50', 'scheduler.o', 'file', 32);
      snap.state.demoStep = 3;
      return snap;
    }
    case 3: {
      const snap = deleteNode(currentSnapshot, 'node-52'); // delete temporary .o
      snap.state.demoStep = 4;
      return snap;
    }
    case 4: {
      const snap = renameNode(currentSnapshot, 'node-51', 'task_scheduler_v2.c');
      snap.state.demoStep = 0; // loop
      return snap;
    }
    default:
      return null;
  }
}
