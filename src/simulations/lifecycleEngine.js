// Process Lifecycle Simulation Engine

export const PROCESS_STATES = {
  NEW: 'NEW',
  READY: 'READY',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED',
};

export const INITIAL_PROCESSES = [
  {
    id: 'P1',
    name: 'Text Editor',
    state: PROCESS_STATES.RUNNING,
    priority: 'Normal',
    memoryMb: 45,
    cpuCyclesSpent: 2,
    cpuCyclesNeeded: 6,
    color: '#8468E8', // Lavender
  },
  {
    id: 'P2',
    name: 'Compiler Build',
    state: PROCESS_STATES.READY,
    priority: 'High',
    memoryMb: 120,
    cpuCyclesSpent: 0,
    cpuCyclesNeeded: 8,
    color: '#4878DF', // Blue
  },
  {
    id: 'P3',
    name: 'Music Player',
    state: PROCESS_STATES.WAITING,
    priority: 'Normal',
    memoryMb: 60,
    cpuCyclesSpent: 1,
    cpuCyclesNeeded: 5,
    waitReason: 'Awaiting Audio Buffer I/O',
    color: '#32A86E', // Green
  },
];

export function getInitialLifecycleSnapshot() {
  return {
    state: {
      processes: [...INITIAL_PROCESSES],
      activeRunningId: 'P1',
      totalCreated: 3,
      eventLog: ['System initialized with 3 active processes. P1 currently has the CPU.'],
    },
    stepNumber: 1,
    action: 'Initial State',
    explanation: {
      what: 'The operating system scheduler initialized 3 processes in different lifecycle states.',
      why: 'Multitasking OSs continuously rotate CPU access among processes in the Ready queue.',
      changed: 'P1 is in RUNNING state; P2 is in READY queue; P3 is in WAITING state for audio hardware.',
      learned: 'At any given millisecond on a single core, only ONE process occupies the RUNNING state.',
    },
  };
}

export function createNewProcess(currentSnapshot, processName = '') {
  const { state } = currentSnapshot;
  const newPid = `P${state.totalCreated + 1}`;
  const name = processName.trim() || `App-${newPid}`;
  
  const colors = ['#8468E8', '#4878DF', '#32A86E', '#E8773E', '#DB5483'];
  const assignedColor = colors[state.totalCreated % colors.length];

  const newProc = {
    id: newPid,
    name,
    state: PROCESS_STATES.NEW,
    priority: 'Normal',
    memoryMb: 32 + Math.floor(Math.random() * 40),
    cpuCyclesSpent: 0,
    cpuCyclesNeeded: 4 + Math.floor(Math.random() * 5),
    color: assignedColor,
  };

  const updatedProcesses = [...state.processes, newProc];

  return {
    state: {
      ...state,
      processes: updatedProcesses,
      totalCreated: state.totalCreated + 1,
      eventLog: [`Created new process ${newPid} (${name}) in NEW state.`, ...state.eventLog.slice(0, 9)],
    },
    action: `Created ${newPid}`,
    explanation: {
      what: `Process ${newPid} (${name}) was instantiated into the NEW state.`,
      why: 'When a user launches an application, the OS allocates a Process Control Block (PCB) in memory.',
      changed: `${newPid} added to NEW pool. It cannot run instructions until admitted into the Ready queue.`,
      learned: 'The NEW state represents initial setup before the OS long-term scheduler admits it to memory.',
    },
  };
}

export function advanceLifecycleStep(currentSnapshot) {
  const { state } = currentSnapshot;
  let procs = state.processes.map((p) => ({ ...p }));
  let logs = [...state.eventLog];
  let what = '';
  let why = '';
  let changed = '';
  let learned = '';
  let action = '';

  // 1. If any process is in NEW, admit it to READY
  const newProc = procs.find((p) => p.state === PROCESS_STATES.NEW);
  if (newProc) {
    newProc.state = PROCESS_STATES.READY;
    action = `Admit ${newProc.id} -> READY`;
    what = `Process ${newProc.id} (${newProc.name}) was admitted to the READY queue.`;
    why = 'The OS has verified available memory and loaded the initial program binary into address space.';
    changed = `${newProc.id} transitioned from NEW to READY queue.`;
    learned: 'Processes in the READY queue are fully prepared and only waiting for CPU time.';
    logs.unshift(`Admitted ${newProc.id} to READY queue.`);
    
    return {
      state: { ...state, processes: procs, eventLog: logs.slice(0, 10) },
      action,
      explanation: { what, why, changed, learned: 'Processes in READY state have all resources allocated and only await CPU assignment.' },
    };
  }

  // 2. Check if WAITING process can complete I/O
  const waitingProc = procs.find((p) => p.state === PROCESS_STATES.WAITING);
  if (waitingProc && Math.random() > 0.4) {
    waitingProc.state = PROCESS_STATES.READY;
    waitingProc.waitReason = null;
    action = `I/O Finished: ${waitingProc.id} -> READY`;
    what = `I/O transfer finished for ${waitingProc.id} (${waitingProc.name}).`;
    why = 'The disk controller/network card issued a hardware interrupt indicating data is in memory.';
    changed = `${waitingProc.id} moved from WAITING/BLOCKED back to the READY queue.`;
    learned = 'When waiting processes finish I/O, they never jump directly to CPU; they must return to READY.';
    logs.unshift(`I/O event completed for ${waitingProc.id}. Returned to READY.`);
    
    return {
      state: { ...state, processes: procs, eventLog: logs.slice(0, 10) },
      action,
      explanation: { what, why, changed, learned },
    };
  }

  // 3. Current running process execution
  const runningProc = procs.find((p) => p.state === PROCESS_STATES.RUNNING);
  if (runningProc) {
    runningProc.cpuCyclesSpent += 1;

    // Check if finished
    if (runningProc.cpuCyclesSpent >= runningProc.cpuCyclesNeeded) {
      runningProc.state = PROCESS_STATES.TERMINATED;
      action = `${runningProc.id} Finished -> TERMINATED`;
      what = `Process ${runningProc.id} executed all needed cycles and called exit().`;
      why = 'The program finished its task; the OS reclaims its memory, open file handles, and PCB.';
      changed = `${runningProc.id} moved to TERMINATED state. CPU core is now idle.`;
      learned = 'TERMINATED processes are cleaned up by the OS so system memory does not leak.';
      logs.unshift(`${runningProc.id} completed all instructions and entered TERMINATED state.`);

      return {
        state: { ...state, processes: procs, activeRunningId: null, eventLog: logs.slice(0, 10) },
        action,
        explanation: { what, why, changed, learned },
      };
    }

    // Check if it requests I/O
    if (runningProc.cpuCyclesSpent === 3 && !procs.some((p) => p.state === PROCESS_STATES.WAITING)) {
      runningProc.state = PROCESS_STATES.WAITING;
      runningProc.waitReason = 'Disk read request';
      action = `${runningProc.id} I/O Request -> WAITING`;
      what = `Process ${runningProc.id} executed a read() system call to load file data.`;
      why = 'Reading from storage is slow, so the process voluntarily yields the CPU core.';
      changed = `${runningProc.id} moved from RUNNING to WAITING.`;
      learned = 'Yielding the CPU during I/O prevents the processor from spinning in wasteful idle loops.';
      logs.unshift(`${runningProc.id} initiated disk read; transitioned to WAITING.`);

      return {
        state: { ...state, processes: procs, activeRunningId: null, eventLog: logs.slice(0, 10) },
        action,
        explanation: { what, why, changed, learned },
      };
    }

    // Time slice preemption: move to READY if another process is waiting in READY
    const readyProcs = procs.filter((p) => p.state === PROCESS_STATES.READY);
    if (readyProcs.length > 0) {
      runningProc.state = PROCESS_STATES.READY;
      const nextToRun = readyProcs[0];
      nextToRun.state = PROCESS_STATES.RUNNING;
      action = `Preempt ${runningProc.id} -> Dispatch ${nextToRun.id}`;
      what = `Time slice expired for ${runningProc.id}. CPU dispatched to ${nextToRun.id}.`;
      why = 'The OS timer interrupt triggered a context switch to ensure fair scheduling for all processes.';
      changed = `${runningProc.id} preempted to READY; ${nextToRun.id} gained the CPU in RUNNING.`;
      learned = 'Timer interrupts prevent any single application from monopolizing the CPU.';
      logs.unshift(`Context switch: ${runningProc.id} preempted, ${nextToRun.id} dispatched to CPU.`);

      return {
        state: { ...state, processes: procs, activeRunningId: nextToRun.id, eventLog: logs.slice(0, 10) },
        action,
        explanation: { what, why, changed, learned },
      };
    }
  } else {
    // No running process: dispatch first ready process
    const readyProcs = procs.filter((p) => p.state === PROCESS_STATES.READY);
    if (readyProcs.length > 0) {
      const nextToRun = readyProcs[0];
      nextToRun.state = PROCESS_STATES.RUNNING;
      action = `Dispatch ${nextToRun.id} -> RUNNING`;
      what = `The OS Short-Term Scheduler picked ${nextToRun.id} from the READY queue.`;
      why = 'The CPU was idle, so the highest-priority/first available ready process is granted the core.';
      changed = `${nextToRun.id} moved from READY to RUNNING state.`;
      learned = 'Dispatcher restores saved CPU registers and jumps the Program Counter to the process instructions.';
      logs.unshift(`Dispatched ${nextToRun.id} to CPU.`);

      return {
        state: { ...state, processes: procs, activeRunningId: nextToRun.id, eventLog: logs.slice(0, 10) },
        action,
        explanation: { what, why, changed, learned },
      };
    }
  }

  // If no action took place, cycle waiting to ready
  const anyWaiting = procs.find((p) => p.state === PROCESS_STATES.WAITING);
  if (anyWaiting) {
    anyWaiting.state = PROCESS_STATES.READY;
    action = `I/O Complete: ${anyWaiting.id} -> READY`;
    what = `${anyWaiting.id} finished its pending I/O transfer.`;
    why = 'Hardware signal arrived; process is now ready for CPU consideration.';
    changed = `${anyWaiting.id} moved from WAITING to READY.`;
    learned = 'Processes cycle dynamically through READY, RUNNING, and WAITING until completion.';
    logs.unshift(`${anyWaiting.id} I/O ready.`);
    return {
      state: { ...state, processes: procs, eventLog: logs.slice(0, 10) },
      action,
      explanation: { what, why, changed, learned },
    };
  }

  // All completed: notify
  return {
    state: {
      ...state,
      eventLog: ['All processes have completed or are idle. Click Create Process to start another!'],
    },
    action: 'Idle',
    explanation: {
      what: 'The CPU runqueue is currently empty.',
      why: 'All active processes have completed execution.',
      changed: 'CPU entered low-power idle halt.',
      learned: 'When no processes are Ready, modern operating systems put the CPU into a power-saving C-state.',
    },
  };
}
