// CPU Scheduling Simulation Engine (FCFS & Round Robin)

export const DEFAULT_SCHEDULING_PROCESSES = [
  { id: 'P1', name: 'Process 1', arrivalTime: 0, burstTime: 5, color: '#8468E8' },
  { id: 'P2', name: 'Process 2', arrivalTime: 1, burstTime: 3, color: '#4878DF' },
  { id: 'P3', name: 'Process 3', arrivalTime: 2, burstTime: 6, color: '#32A86E' },
  { id: 'P4', name: 'Process 4', arrivalTime: 4, burstTime: 2, color: '#E8773E' },
];

/**
 * Computes the full execution timeline and step snapshots for FCFS
 */
export function calculateFCFS(processes) {
  // Sort by arrival time, then id
  const procs = processes.map((p) => ({ ...p, remainingTime: p.burstTime }));
  
  let currentTime = 0;
  const gantt = [];
  const snapshots = [];
  const completed = {};
  
  // Find max time boundary
  const totalBurst = procs.reduce((acc, p) => acc + p.burstTime, 0);
  const maxTime = Math.max(...procs.map((p) => p.arrivalTime)) + totalBurst + 2;

  // Initial snapshot at t=0
  snapshots.push(buildSchedulingSnapshot({
    time: 0,
    activeProcessId: null,
    gantt: [],
    processes: procs.map(p => ({ ...p })),
    readyQueue: procs.filter(p => p.arrivalTime === 0).map(p => p.id),
    completed: {},
    algorithm: 'FCFS',
    action: 'Simulation Start',
    explanation: {
      what: 'FCFS scheduling initialized at time t = 0.',
      why: 'First-Come First-Served executes processes in the strict order of their arrival time.',
      changed: `Processes with arrival time 0 entered the ready queue.`,
      learned: 'FCFS is non-preemptive: once a process gains the CPU, it runs until its burst finishes.',
    },
  }));

  let active = null;
  const readyQueue = [];

  for (currentTime = 0; currentTime < maxTime; currentTime++) {
    // Check arrivals at this exact unit
    const newArrivals = procs.filter((p) => p.arrivalTime === currentTime);
    for (const p of newArrivals) {
      if (!readyQueue.includes(p.id) && !completed[p.id] && (!active || active.id !== p.id)) {
        readyQueue.push(p.id);
      }
    }

    // If no active process, pick from ready queue
    if (!active && readyQueue.length > 0) {
      const nextId = readyQueue.shift();
      active = procs.find((p) => p.id === nextId);
    }

    if (active) {
      gantt.push({ time: currentTime, processId: active.id, color: active.color });
      active.remainingTime -= 1;

      const isFinished = active.remainingTime <= 0;
      const pid = active.id;

      if (isFinished) {
        completed[pid] = {
          completionTime: currentTime + 1,
          turnaroundTime: currentTime + 1 - active.arrivalTime,
          waitingTime: currentTime + 1 - active.arrivalTime - active.burstTime,
        };
      }

      snapshots.push(buildSchedulingSnapshot({
        time: currentTime + 1,
        activeProcessId: pid,
        gantt: [...gantt],
        processes: procs.map((p) => ({ ...p })),
        readyQueue: [...readyQueue],
        completed: { ...completed },
        algorithm: 'FCFS',
        action: isFinished ? `${pid} Finished` : `Running ${pid}`,
        explanation: {
          what: isFinished
            ? `${pid} completed all ${active.burstTime} CPU bursts at time ${currentTime + 1}.`
            : `CPU executed 1 burst unit for ${pid} (remaining: ${active.remainingTime}).`,
          why: 'Under FCFS, the running process holds the CPU exclusively until completion.',
          changed: isFinished
            ? `${pid} moved to Completed table. CPU will select the next arriving process.`
            : `Gantt chart expanded to t = ${currentTime + 1}.`,
          learned: isFinished
            ? `Turnaround Time = Completion (${currentTime + 1}) - Arrival (${active.arrivalTime}) = ${currentTime + 1 - active.arrivalTime} units.`
            : 'Non-preemptive scheduling avoids context-switch overhead but can cause long waits for short jobs.',
        },
      }));

      if (isFinished) {
        active = null;
      }
    } else {
      // CPU Idle
      gantt.push({ time: currentTime, processId: 'IDLE', color: '#DDDCEB' });
      snapshots.push(buildSchedulingSnapshot({
        time: currentTime + 1,
        activeProcessId: null,
        gantt: [...gantt],
        processes: procs.map((p) => ({ ...p })),
        readyQueue: [...readyQueue],
        completed: { ...completed },
        algorithm: 'FCFS',
        action: 'CPU Idle',
        explanation: {
          what: `CPU is IDLE during time unit ${currentTime} -> ${currentTime + 1}.`,
          why: 'No processes have arrived or are ready in the queue.',
          changed: 'An idle block was recorded in the Gantt chart.',
          learned: 'OS schedulers monitor arrival times to dispatch work the moment a task becomes ready.',
        },
      }));
    }

    // Stop early if all completed
    if (Object.keys(completed).length === procs.length) {
      break;
    }
  }

  return snapshots;
}

/**
 * Computes the full execution timeline and step snapshots for Round Robin
 */
export function calculateRoundRobin(processes, timeQuantum = 2) {
  const procs = processes.map((p) => ({ ...p, remainingTime: p.burstTime }));
  const gantt = [];
  const snapshots = [];
  const completed = {};

  const totalBurst = procs.reduce((acc, p) => acc + p.burstTime, 0);
  const maxTime = Math.max(...procs.map((p) => p.arrivalTime)) + totalBurst + 5;

  snapshots.push(buildSchedulingSnapshot({
    time: 0,
    activeProcessId: null,
    gantt: [],
    processes: procs.map((p) => ({ ...p })),
    readyQueue: procs.filter((p) => p.arrivalTime === 0).map((p) => p.id),
    completed: {},
    algorithm: 'RR',
    timeQuantum,
    action: 'Simulation Start',
    explanation: {
      what: `Round Robin scheduling started with Time Quantum = ${timeQuantum}.`,
      why: 'Round Robin is preemptive: each process runs for up to Q time units before yielding.',
      changed: `Processes with arrival time 0 queued. Quantum set to ${timeQuantum}.`,
      learned: 'Round Robin ensures responsiveness in interactive systems by sharing CPU fairly.',
    },
  }));

  const readyQueue = [];
  let currentQuantumLeft = timeQuantum;
  let active = null;

  for (let currentTime = 0; currentTime < maxTime; currentTime++) {
    // 1. Arriving processes at currentTime
    const newArrivals = procs.filter((p) => p.arrivalTime === currentTime);
    for (const p of newArrivals) {
      if (!readyQueue.includes(p.id) && !completed[p.id] && (!active || active.id !== p.id)) {
        readyQueue.push(p.id);
      }
    }

    // 2. Pick active if none
    if (!active && readyQueue.length > 0) {
      const nextId = readyQueue.shift();
      active = procs.find((p) => p.id === nextId);
      currentQuantumLeft = timeQuantum;
    }

    if (active) {
      gantt.push({ time: currentTime, processId: active.id, color: active.color });
      active.remainingTime -= 1;
      currentQuantumLeft -= 1;

      const isFinished = active.remainingTime <= 0;
      const pid = active.id;

      if (isFinished) {
        completed[pid] = {
          completionTime: currentTime + 1,
          turnaroundTime: currentTime + 1 - active.arrivalTime,
          waitingTime: currentTime + 1 - active.arrivalTime - active.burstTime,
        };
      }

      // Check for arrivals right before potential preemption swap at currentTime + 1
      const upcomingArrivals = procs.filter((p) => p.arrivalTime === currentTime + 1);
      for (const up of upcomingArrivals) {
        if (!readyQueue.includes(up.id) && !completed[up.id] && up.id !== pid) {
          readyQueue.push(up.id);
        }
      }

      const isPreempted = !isFinished && currentQuantumLeft === 0;

      let explanationText = '';
      if (isFinished) {
        explanationText = `${pid} completed all work at time ${currentTime + 1}.`;
      } else if (isPreempted) {
        explanationText = `Time quantum (${timeQuantum}) expired for ${pid}. It is preempted to the back of the Ready queue.`;
      } else {
        explanationText = `CPU executed 1 slice for ${pid} (quantum remaining: ${currentQuantumLeft}).`;
      }

      snapshots.push(buildSchedulingSnapshot({
        time: currentTime + 1,
        activeProcessId: pid,
        gantt: [...gantt],
        processes: procs.map((p) => ({ ...p })),
        readyQueue: isPreempted ? [...readyQueue, pid] : [...readyQueue],
        completed: { ...completed },
        algorithm: 'RR',
        timeQuantum,
        action: isFinished ? `${pid} Finished` : isPreempted ? `Preempt ${pid}` : `Running ${pid}`,
        explanation: {
          what: explanationText,
          why: isPreempted
            ? 'Preemption prevents long compute processes from starving smaller interactive ones.'
            : 'Processes receive CPU time in equal round-robin turns.',
          changed: isPreempted
            ? `${pid} re-entered the back of the queue; next process will take over.`
            : `Gantt chart updated. Remaining burst for ${pid}: ${active.remainingTime}.`,
          learned:
            'A smaller quantum improves response time but increases context-switch overhead; a large quantum degenerates into FCFS.',
        },
      }));

      if (isFinished) {
        active = null;
        currentQuantumLeft = timeQuantum;
      } else if (isPreempted) {
        readyQueue.push(active.id);
        active = null;
        currentQuantumLeft = timeQuantum;
      }
    } else {
      gantt.push({ time: currentTime, processId: 'IDLE', color: '#DDDCEB' });
      snapshots.push(buildSchedulingSnapshot({
        time: currentTime + 1,
        activeProcessId: null,
        gantt: [...gantt],
        processes: procs.map((p) => ({ ...p })),
        readyQueue: [...readyQueue],
        completed: { ...completed },
        algorithm: 'RR',
        timeQuantum,
        action: 'CPU Idle',
        explanation: {
          what: `CPU is IDLE during time unit ${currentTime} -> ${currentTime + 1}.`,
          why: 'No processes are in the Ready queue.',
          changed: 'Gantt chart recorded idle tick.',
          learned: 'OS schedulers awaken as soon as timer interrupts or I/O interrupts enqueue a new task.',
        },
      }));
    }

    if (Object.keys(completed).length === procs.length) {
      break;
    }
  }

  return snapshots;
}

function buildSchedulingSnapshot({
  time,
  activeProcessId,
  gantt,
  processes,
  readyQueue,
  completed,
  algorithm,
  timeQuantum = 2,
  action,
  explanation,
}) {
  // Compute metrics
  const completedEntries = Object.entries(completed);
  const count = completedEntries.length;
  let totalWT = 0;
  let totalTAT = 0;

  for (const [, val] of completedEntries) {
    totalWT += val.waitingTime;
    totalTAT += val.turnaroundTime;
  }

  const avgWaitingTime = count > 0 ? (totalWT / count).toFixed(2) : '0.00';
  const avgTurnaroundTime = count > 0 ? (totalTAT / count).toFixed(2) : '0.00';
  const busyTicks = gantt.filter((g) => g.processId !== 'IDLE').length;
  const cpuUtilization = time > 0 ? Math.round((busyTicks / time) * 100) : 100;

  return {
    state: {
      time,
      activeProcessId,
      gantt,
      processes,
      readyQueue,
      completed,
      algorithm,
      timeQuantum,
      metrics: {
        avgWaitingTime,
        avgTurnaroundTime,
        cpuUtilization,
        completedCount: count,
        totalProcesses: processes.length,
      },
    },
    action,
    explanation,
  };
}
