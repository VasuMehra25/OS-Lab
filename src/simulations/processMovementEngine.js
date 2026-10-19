// OS Inside — Real-Time Process Movement Simulator Engine
// Unified domain model tracking processes moving through Secondary Storage -> RAM -> Ready Queue -> CPU -> Terminated / Swapped

export const BLOCK_SIZE_KB = 32;

export const RAM_CAPACITY_OPTIONS = [
  { kb: 256, blocks: 8, label: '256 KB (8 Blocks)' },
  { kb: 512, blocks: 16, label: '512 KB (16 Blocks — Standard)' },
  { kb: 768, blocks: 24, label: '768 KB (24 Blocks)' },
  { kb: 1024, blocks: 32, label: '1024 KB (32 Blocks — Expanded)' },
];

const PROCESS_COLORS = [
  '#18A558', // Solid Emerald Green
  '#D4A017', // Solid Golden Amber
  '#10B981', // Mint Jade Green
  '#EAB308', // Warm Sun Yellow
  '#0F7D3E', // Forest Green
  '#CA8A04', // Golden Ochre
  '#65A30D', // Lime Leaf Green
  '#D97706', // Rich Gold Amber
];

export const INITIAL_STORAGE_PROCESSES = [
  {
    id: 'P1',
    name: 'Web Browser',
    sizeKb: 64,
    burstTicks: 4,
    remainingTicks: 4,
    color: '#18A558', // Green
    state: 'STORAGE',
  },
  {
    id: 'P2',
    name: 'Code Compiler',
    sizeKb: 96,
    burstTicks: 5,
    remainingTicks: 5,
    color: '#D4A017', // Golden Yellow
    state: 'STORAGE',
  },
  {
    id: 'P3',
    name: 'Music Player',
    sizeKb: 64,
    burstTicks: 3,
    remainingTicks: 3,
    color: '#10B981', // Mint Green
    state: 'STORAGE',
  },
  {
    id: 'P4',
    name: 'Image Editor',
    sizeKb: 128,
    burstTicks: 6,
    remainingTicks: 6,
    color: '#EAB308', // Golden Yellow
    state: 'STORAGE',
  },
];

function createEmptyBlocks(totalBlocks) {
  return Array.from({ length: totalBlocks }, (_, i) => ({
    blockId: i,
    processId: null,
    processName: null,
    color: null,
  }));
}

export function getInitialMovementSnapshot(ramCapacityKb = 512) {
  const totalBlocks = ramCapacityKb / BLOCK_SIZE_KB;
  const blocks = createEmptyBlocks(totalBlocks);
  const initialProcesses = INITIAL_STORAGE_PROCESSES.map((p) => ({ ...p }));

  const usedRamKb = 0;
  const freeRamKb = ramCapacityKb;

  return {
    state: {
      ramCapacityKb,
      totalBlocks,
      blocks,
      processes: initialProcesses,
      storageQueue: ['P1', 'P2', 'P3', 'P4'],
      ramAllocatedIds: [],
      readyQueue: [],
      activeCpuId: null,
      swappedQueue: [],
      terminatedQueue: [],
      selectedProcessId: 'P1',
      lastAllocationFailed: null,
      nextPidNumber: 5,
      systemClock: 0,
      metrics: {
        totalRamKb: ramCapacityKb,
        usedRamKb,
        freeRamKb,
        ramUtilizationPercent: Math.round((usedRamKb / ramCapacityKb) * 100),
        storageCount: 4,
        ramCount: 0,
        readyCount: 0,
        cpuRunning: 'None (Idle)',
        swappedCount: 0,
        terminatedCount: 0,
      },
    },
    stepNumber: 1,
    action: 'System Initialized',
    explanation: {
      what: 'Operating System loaded. 4 user applications reside on secondary storage awaiting admission to RAM.',
      why: 'Programs must be transferred from disk (secondary storage) into physical RAM before CPU instructions can execute.',
      changed: `RAM initialized with ${ramCapacityKb} KB (${totalBlocks} blocks). All blocks are free for process allocations.`,
      learned: 'The OS Long-Term Scheduler evaluates memory availability before admitting programs from disk into RAM.',
    },
  };
}

/**
 * First-Fit contiguous block scanner
 */
function findFirstFitHole(blocks, blocksNeeded) {
  let runStart = -1;
  let runLength = 0;

  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].processId === null) {
      if (runStart === -1) runStart = i;
      runLength += 1;
      if (runLength === blocksNeeded) {
        return runStart;
      }
    } else {
      runStart = -1;
      runLength = 0;
    }
  }
  return -1;
}

/**
 * Creates a brand new process and enqueues it into Secondary Storage
 */
export function createMovementProcess(currentSnapshot, name, sizeKb = 64, burstTicks = 4) {
  const { state } = currentSnapshot;
  const pid = `P${state.nextPidNumber}`;
  const procName = name?.trim() || `App-${pid}`;
  const validSize = Math.max(32, Math.min(256, Number(sizeKb) || 64));
  const validBurst = Math.max(1, Math.min(10, Number(burstTicks) || 4));
  const color = PROCESS_COLORS[(state.nextPidNumber - 1) % PROCESS_COLORS.length];

  const newProc = {
    id: pid,
    name: procName,
    sizeKb: validSize,
    burstTicks: validBurst,
    remainingTicks: validBurst,
    color,
    state: 'STORAGE',
  };

  const updatedProcesses = [...state.processes, newProc];
  const updatedStorage = [...state.storageQueue, pid];

  const nextState = {
    ...state,
    processes: updatedProcesses,
    storageQueue: updatedStorage,
    selectedProcessId: pid,
    nextPidNumber: state.nextPidNumber + 1,
  };

  return computeMetricsAndSnapshot(
    nextState,
    `Created ${pid} in Storage`,
    {
      what: `New process ${pid} ("${procName}") created and saved in Secondary Storage.`,
      why: 'Applications reside on disk until the OS scheduler admits them into RAM.',
      changed: `Added ${pid} (${validSize} KB, ${validBurst} ticks) to Secondary Storage queue.`,
      learned: 'Creating a process creates its executable image and PCB; it does not occupy physical RAM yet.',
    }
  );
}

/**
 * Main simulation step advancement
 * Sequence:
 * 1. If CPU has a running process:
 *    - decrement remainingTicks
 *    - if finished: terminate, release RAM, dispatch next from Ready Queue
 *    - if time slice (e.g. 2 ticks) or needs yield: round-robin or continue
 * 2. If CPU is idle:
 *    - dispatch first process from Ready Queue to CPU
 * 3. Admit eligible process from Secondary Storage into RAM if contiguous hole available
 */
export function advanceMovementStep(currentSnapshot) {
  const { state } = currentSnapshot;
  let processes = state.processes.map((p) => ({ ...p }));
  let blocks = state.blocks.map((b) => ({ ...b }));
  let storageQueue = [...state.storageQueue];
  let ramAllocatedIds = [...state.ramAllocatedIds];
  let readyQueue = [...state.readyQueue];
  let activeCpuId = state.activeCpuId;
  let swappedQueue = [...state.swappedQueue];
  let terminatedQueue = [...state.terminatedQueue];
  let lastAllocationFailed = null;
  const clock = state.systemClock + 1;

  let action = '';
  let what = '';
  let why = '';
  let changed = '';
  let learned = '';

  // 1. If a process is currently executing on the CPU:
  if (activeCpuId) {
    const runningProc = processes.find((p) => p.id === activeCpuId);
    runningProc.remainingTicks -= 1;

    if (runningProc.remainingTicks <= 0) {
      // Process Finished! Release RAM blocks and move to Terminated
      runningProc.state = 'TERMINATED';
      activeCpuId = null;
      terminatedQueue.unshift(runningProc.id);
      ramAllocatedIds = ramAllocatedIds.filter((id) => id !== runningProc.id);

      // Release RAM blocks owned by this process
      blocks = blocks.map((b) => {
        if (b.processId === runningProc.id) {
          return { blockId: b.blockId, processId: null, processName: null, color: null, isKernel: false };
        }
        return b;
      });

      action = `${runningProc.id} Finished & Released RAM`;
      what = `Process ${runningProc.id} ("${runningProc.name}") completed execution and called exit().`;
      why = 'When execution completes, the OS reclaims CPU registers and frees all occupied RAM partitions.',
      changed = `${runningProc.id} moved to Terminated. ${runningProc.sizeKb} KB of RAM was reclaimed to the free pool.`;
      learned = 'Promptly releasing memory when tasks terminate prevents system-wide memory exhaustion.';
    } else {
      // Still running on CPU
      action = `CPU Executing ${runningProc.id}`;
      what = `CPU executed 1 clock cycle for ${runningProc.id} (${runningProc.remainingTicks} ticks remaining).`;
      why = 'The process holds the CPU core during its allocated time slice.',
      changed = `Execution progress for ${runningProc.id} updated. Clock = t + ${clock}.`;
      learned = 'The CPU executes machine instructions sequentially until time slice expiration or program completion.';
    }

    // Try admitting next storage process concurrently if RAM has freed up
    if (storageQueue.length > 0) {
      const candidatePid = storageQueue[0];
      const candidateProc = processes.find((p) => p.id === candidatePid);
      const blocksNeeded = Math.ceil(candidateProc.sizeKb / BLOCK_SIZE_KB);
      const holeStart = findFirstFitHole(blocks, blocksNeeded);

      if (holeStart !== -1) {
        // Allocate!
        storageQueue.shift();
        ramAllocatedIds.push(candidatePid);
        readyQueue.push(candidatePid);
        candidateProc.state = 'RAM_READY';
        candidateProc.startBlock = holeStart;
        candidateProc.blocksCount = blocksNeeded;

        for (let b = holeStart; b < holeStart + blocksNeeded; b++) {
          blocks[b] = {
            blockId: b,
            processId: candidatePid,
            processName: candidateProc.name,
            color: candidateProc.color,
            isKernel: false,
          };
        }
      }
    }

    return computeMetricsAndSnapshot(
      {
        ...state,
        processes,
        blocks,
        storageQueue,
        ramAllocatedIds,
        readyQueue,
        activeCpuId,
        swappedQueue,
        terminatedQueue,
        lastAllocationFailed,
        systemClock: clock,
      },
      action,
      { what, why, changed, learned }
    );
  }

  // 2. If CPU is IDLE: Dispatch from Ready Queue if available
  if (!activeCpuId && readyQueue.length > 0) {
    const nextPid = readyQueue.shift();
    const nextProc = processes.find((p) => p.id === nextPid);
    activeCpuId = nextPid;
    nextProc.state = 'CPU_RUNNING';

    action = `Dispatched ${nextPid} to CPU`;
    what = `Short-Term Scheduler dispatched ${nextPid} ("${nextProc.name}") from Ready Queue to the CPU.`;
    why = 'The CPU core was idle, so the OS context-switches and loads the process registers.';
    changed = `${nextPid} moved from Ready Queue to CPU. CPU status transitioned to ACTIVE.`;
    learned = 'The Dispatcher restores saved registers and jumps the Program Counter to the process instructions.';

    return computeMetricsAndSnapshot(
      {
        ...state,
        processes,
        blocks,
        storageQueue,
        ramAllocatedIds,
        readyQueue,
        activeCpuId,
        swappedQueue,
        terminatedQueue,
        lastAllocationFailed,
        systemClock: clock,
      },
      action,
      { what, why, changed, learned }
    );
  }

  // 3. If storage has waiting processes, attempt RAM allocation (First-Fit)
  if (storageQueue.length > 0) {
    const candidatePid = storageQueue[0];
    const candidateProc = processes.find((p) => p.id === candidatePid);
    const blocksNeeded = Math.ceil(candidateProc.sizeKb / BLOCK_SIZE_KB);
    const holeStart = findFirstFitHole(blocks, blocksNeeded);

    if (holeStart !== -1) {
      // Allocation Succeeded!
      storageQueue.shift();
      ramAllocatedIds.push(candidatePid);
      readyQueue.push(candidatePid);
      candidateProc.state = 'RAM_READY';
      candidateProc.startBlock = holeStart;
      candidateProc.blocksCount = blocksNeeded;

      for (let b = holeStart; b < holeStart + blocksNeeded; b++) {
        blocks[b] = {
          blockId: b,
          processId: candidatePid,
          processName: candidateProc.name,
          color: candidateProc.color,
          isKernel: false,
        };
      }

      action = `Loaded ${candidatePid} into RAM`;
      what = `Loaded ${candidatePid} (${candidateProc.sizeKb} KB) from Secondary Storage into RAM Blocks ${holeStart}–${holeStart + blocksNeeded - 1}.`;
      why = 'Sufficient contiguous physical memory was available. First-Fit assigned the lowest matching address hole.';
      changed = `${candidatePid} moved from Disk to RAM and entered the Ready Queue.`;
      learned = 'Once allocated in RAM, a process enters the Ready Queue to wait for CPU scheduling.';

      return computeMetricsAndSnapshot(
        {
          ...state,
          processes,
          blocks,
          storageQueue,
          ramAllocatedIds,
          readyQueue,
          activeCpuId,
          swappedQueue,
          terminatedQueue,
          lastAllocationFailed: null,
          systemClock: clock,
        },
        action,
        { what, why, changed, learned }
      );
    } else {
      // Allocation Failed: RAM full or external fragmentation!
      const totalFreeBlocks = blocks.filter((b) => b.processId === null).length;
      const totalFreeKb = totalFreeBlocks * BLOCK_SIZE_KB;

      lastAllocationFailed = {
        processId: candidatePid,
        processName: candidateProc.name,
        requestedKb: candidateProc.sizeKb,
        freeKb: totalFreeKb,
        isFragmented: totalFreeKb >= candidateProc.sizeKb,
      };

      action = `Allocation Failed: ${candidatePid}`;
      what = `Cannot admit ${candidatePid} (${candidateProc.sizeKb} KB) into RAM.`;
      why = lastAllocationFailed.isFragmented
        ? `External Fragmentation: ${totalFreeKb} KB total free RAM exists, but it is split into non-contiguous holes smaller than ${candidateProc.sizeKb} KB.`
        : `Memory Exhausted: Only ${totalFreeKb} KB free in RAM; ${candidateProc.sizeKb} KB required.`;
      changed = 'Process remains on Secondary Storage. Try Swapping an active process out to disk to free space.';
      learned = 'When RAM cannot fit a job, the OS must wait for completions, compact memory, or swap processes out.';

      return computeMetricsAndSnapshot(
        {
          ...state,
          processes,
          blocks,
          storageQueue,
          ramAllocatedIds,
          readyQueue,
          activeCpuId,
          swappedQueue,
          terminatedQueue,
          lastAllocationFailed,
          systemClock: clock,
        },
        action,
        { what, why, changed, learned }
      );
    }
  }

  // 4. If idle and nothing to do, encourage creating a process
  return computeMetricsAndSnapshot(
    {
      ...state,
      systemClock: clock,
      lastAllocationFailed: null,
    },
    'System Idle',
    {
      what: 'The operating system is idle. All admitted processes have finished.',
      why: 'No tasks remain in Secondary Storage, Ready Queue, or CPU.',
      changed: 'CPU halted in low-power idle state.',
      learned: 'Create a new process or use preset templates to test memory movement and swapping.',
    }
  );
}

/**
 * Swaps an entire process out of RAM to Secondary Storage (Swap Area)
 */
export function swapOutProcess(currentSnapshot, processId) {
  const { state } = currentSnapshot;
  const proc = state.processes.find((p) => p.id === processId);

  if (!proc || proc.state === 'STORAGE' || proc.state === 'TERMINATED' || proc.state === 'SWAPPED') {
    return currentSnapshot;
  }

  // Free RAM blocks
  const blocks = state.blocks.map((b) => {
    if (b.processId === processId) {
      return { blockId: b.blockId, processId: null, processName: null, color: null, isKernel: false };
    }
    return { ...b };
  });

  const processes = state.processes.map((p) => {
    if (p.id === processId) {
      return { ...p, state: 'SWAPPED', startBlock: null, blocksCount: 0 };
    }
    return { ...p };
  });

  const ramAllocatedIds = state.ramAllocatedIds.filter((id) => id !== processId);
  const readyQueue = state.readyQueue.filter((id) => id !== processId);
  const activeCpuId = state.activeCpuId === processId ? null : state.activeCpuId;
  const swappedQueue = [...state.swappedQueue, processId];

  const nextState = {
    ...state,
    blocks,
    processes,
    ramAllocatedIds,
    readyQueue,
    activeCpuId,
    swappedQueue,
    lastAllocationFailed: null,
  };

  return computeMetricsAndSnapshot(
    nextState,
    `Swapped Out ${processId}`,
    {
      what: `Process ${processId} ("${proc.name}") was swapped out of RAM to Secondary Storage (Swap Space).`,
      why: 'Swapping frees contiguous RAM blocks to allow other high-priority or waiting processes to enter memory.',
      changed: `${proc.sizeKb} KB reclaimed in RAM. ${processId} moved to Swapped Area on disk.`,
      learned: 'Swapping moves an ENTIRE process image between RAM and secondary storage (unlike Paging, which moves individual 4KB frames).',
    }
  );
}

/**
 * Swaps a process back from Swap Area into RAM if space permits
 */
export function swapInProcess(currentSnapshot, processId) {
  const { state } = currentSnapshot;
  const proc = state.processes.find((p) => p.id === processId);

  if (!proc || proc.state !== 'SWAPPED') {
    return currentSnapshot;
  }

  const blocksNeeded = Math.ceil(proc.sizeKb / BLOCK_SIZE_KB);
  const holeStart = findFirstFitHole(state.blocks, blocksNeeded);

  if (holeStart === -1) {
    const totalFree = state.blocks.filter((b) => b.processId === null).length * BLOCK_SIZE_KB;
    return computeMetricsAndSnapshot(
      state,
      `Cannot Swap In ${processId}`,
      {
        what: `Cannot swap in ${processId}: insufficient contiguous memory in RAM.`,
        why: `Requires ${proc.sizeKb} KB contiguous blocks, but available hole is too small (${totalFree} KB total free).`,
        changed: 'No memory blocks modified. Process remains in Swapped Area.',
        learned: 'Processes in Swap Area must wait until another process completes or is swapped out.',
      }
    );
  }

  const blocks = state.blocks.map((b) => {
    if (b.blockId >= holeStart && b.blockId < holeStart + blocksNeeded) {
      return {
        blockId: b.blockId,
        processId: proc.id,
        processName: proc.name,
        color: proc.color,
        isKernel: false,
      };
    }
    return { ...b };
  });

  const processes = state.processes.map((p) => {
    if (p.id === processId) {
      return { ...p, state: 'RAM_READY', startBlock: holeStart, blocksCount: blocksNeeded };
    }
    return { ...p };
  });

  const ramAllocatedIds = [...state.ramAllocatedIds, processId];
  const readyQueue = [...state.readyQueue, processId];
  const swappedQueue = state.swappedQueue.filter((id) => id !== processId);

  return computeMetricsAndSnapshot(
    {
      ...state,
      blocks,
      processes,
      ramAllocatedIds,
      readyQueue,
      swappedQueue,
      lastAllocationFailed: null,
    },
    `Swapped In ${processId}`,
    {
      what: `Process ${processId} ("${proc.name}") was swapped back into physical RAM at Blocks ${holeStart}–${holeStart + blocksNeeded - 1}.`,
      why: 'Memory became available, so the OS Medium-Term Scheduler reloaded the suspended process image.',
      changed: `${processId} re-entered the Ready Queue and is eligible for CPU dispatching.`,
      learned: 'Medium-Term Schedulers manage the Degree of Multiprogramming by swapping processes in and out.',
    }
  );
}

/**
 * Changes total physical RAM capacity dynamically
 */
export function changeRamCapacity(currentSnapshot, newCapacityKb) {
  const { state } = currentSnapshot;
  const newTotalBlocks = newCapacityKb / BLOCK_SIZE_KB;

  // Rebuild blocks
  let newBlocks = createEmptyBlocks(newTotalBlocks);

  // Reset processes to secondary storage so user can observe re-allocation
  const resetProcesses = state.processes.map((p) => ({
    ...p,
    state: p.state === 'TERMINATED' ? 'TERMINATED' : 'STORAGE',
    remainingTicks: p.burstTicks,
    startBlock: null,
    blocksCount: 0,
  }));

  const storageQueue = resetProcesses.filter((p) => p.state === 'STORAGE').map((p) => p.id);

  const nextState = {
    ...state,
    ramCapacityKb: newCapacityKb,
    totalBlocks: newTotalBlocks,
    blocks: newBlocks,
    processes: resetProcesses,
    storageQueue,
    ramAllocatedIds: [],
    readyQueue: [],
    activeCpuId: null,
    swappedQueue: [],
    lastAllocationFailed: null,
  };

  return computeMetricsAndSnapshot(
    nextState,
    `RAM Capacity set to ${newCapacityKb} KB`,
    {
      what: `Hardware RAM capacity resized to ${newCapacityKb} KB (${newTotalBlocks} blocks).`,
      why: 'Operating systems adapt to hardware physical memory configurations.',
      changed: `Memory grid reset with ${newTotalBlocks} blocks. All active processes re-queued to Secondary Storage.`,
      learned: 'Larger RAM capacity increases the Degree of Multiprogramming, allowing more processes to run concurrently.',
    }
  );
}

/**
 * Directly admit a specific process from Secondary Storage into RAM (hover-to-load).
 * Performs First-Fit allocation for that specific pid.
 */
export function admitProcessToRam(currentSnapshot, processId) {
  const { state } = currentSnapshot;
  const proc = state.processes.find((p) => p.id === processId);

  if (!proc || proc.state !== 'STORAGE') {
    return currentSnapshot;
  }

  // Check if it is actually in the storageQueue
  if (!state.storageQueue.includes(processId)) {
    return currentSnapshot;
  }

  const blocks = state.blocks.map((b) => ({ ...b }));
  const blocksNeeded = Math.ceil(proc.sizeKb / BLOCK_SIZE_KB);
  const holeStart = findFirstFitHole(blocks, blocksNeeded);

  if (holeStart === -1) {
    // Cannot allocate — RAM full or fragmented
    const totalFreeBlocks = blocks.filter((b) => b.processId === null).length;
    const totalFreeKb = totalFreeBlocks * BLOCK_SIZE_KB;
    return computeMetricsAndSnapshot(
      {
        ...state,
        lastAllocationFailed: {
          processId,
          processName: proc.name,
          requestedKb: proc.sizeKb,
          freeKb: totalFreeKb,
          isFragmented: totalFreeKb >= proc.sizeKb,
        },
      },
      `Admit Failed: ${processId}`,
      {
        what: `Cannot load ${processId} (${proc.sizeKb} KB) — no contiguous free blocks.`,
        why: totalFreeKb >= proc.sizeKb
          ? 'External Fragmentation: free blocks are scattered and non-contiguous.'
          : 'RAM is full — another process must finish or be swapped out first.',
        changed: `${processId} remains in Secondary Storage.`,
        learned: 'First-Fit requires contiguous blocks. Fragmented free space cannot satisfy large requests.',
      }
    );
  }

  // Allocate blocks
  for (let b = holeStart; b < holeStart + blocksNeeded; b++) {
    blocks[b] = {
      blockId: b,
      processId,
      processName: proc.name,
      color: proc.color,
    };
  }

  const processes = state.processes.map((p) => {
    if (p.id !== processId) return p;
    return { ...p, state: 'RAM_READY', startBlock: holeStart, blocksCount: blocksNeeded };
  });

  const storageQueue = state.storageQueue.filter((id) => id !== processId);
  const ramAllocatedIds = [...state.ramAllocatedIds, processId];
  const readyQueue = [...state.readyQueue, processId];

  return computeMetricsAndSnapshot(
    {
      ...state,
      processes,
      blocks,
      storageQueue,
      ramAllocatedIds,
      readyQueue,
      selectedProcessId: processId,
      lastAllocationFailed: null,
    },
    `Loaded ${processId} into RAM`,
    {
      what: `Manually admitted ${processId} ("${proc.name}") from Secondary Storage into RAM Blocks ${holeStart}–${holeStart + blocksNeeded - 1}.`,
      why: 'First-Fit allocation found a contiguous free region starting at Block ' + holeStart + '.',
      changed: `${processId} is now in Physical RAM and entered the Ready Queue for CPU scheduling.`,
      learned: 'Hover-to-admit lets you control exactly which process gets loaded into RAM, demonstrating the OS loader.',
    }
  );
}

function computeMetricsAndSnapshot(nextState, action, explanation) {
  const totalRamKb = nextState.ramCapacityKb;
  const usedBlocks = nextState.blocks.filter((b) => b.processId !== null).length;
  const usedRamKb = usedBlocks * BLOCK_SIZE_KB;
  const freeRamKb = totalRamKb - usedRamKb;
  const ramUtilizationPercent = Math.round((usedRamKb / totalRamKb) * 100);

  const cpuProc = nextState.processes.find((p) => p.id === nextState.activeCpuId);

  const metrics = {
    totalRamKb,
    usedRamKb,
    freeRamKb,
    ramUtilizationPercent,
    storageCount: nextState.storageQueue.length,
    ramCount: nextState.ramAllocatedIds.length,
    readyCount: nextState.readyQueue.length,
    cpuRunning: cpuProc ? `${cpuProc.id} (${cpuProc.name})` : 'Idle',
    swappedCount: nextState.swappedQueue.length,
    terminatedCount: nextState.terminatedQueue.length,
  };

  return {
    state: {
      ...nextState,
      metrics,
    },
    action,
    explanation,
  };
}
