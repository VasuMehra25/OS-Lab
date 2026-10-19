// I/O Request Queue Simulation Engine

export const DEVICE_TYPES = {
  PRINTER: {
    id: 'PRINTER',
    name: 'Laser Document Printer',
    unit: 'Pages',
    speedLabel: '12 PPM (Mechanical)',
    color: '#32A86E',
  },
  DISK: {
    id: 'DISK',
    name: 'Secondary NVMe / SATA Disk',
    unit: 'Blocks',
    speedLabel: 'Direct Memory Access (DMA)',
    color: '#4878DF',
  },
};

export const INITIAL_IO_REQUESTS = [
  { id: 'REQ-101', processId: 'P1', processName: 'Text Editor', operation: 'Print Report.pdf', durationTicks: 3, remainingTicks: 3, state: 'PROCESSING', color: '#8468E8' },
  { id: 'REQ-102', processId: 'P2', processName: 'Compiler', operation: 'Write debug_symbols.log', durationTicks: 2, remainingTicks: 2, state: 'QUEUED', color: '#4878DF' },
  { id: 'REQ-103', processId: 'P3', processName: 'Web Browser', operation: 'Print Ticket.pdf', durationTicks: 4, remainingTicks: 4, state: 'QUEUED', color: '#32A86E' },
];

export function getInitialIoSnapshot() {
  return {
    state: {
      deviceType: 'PRINTER',
      deviceStatus: 'BUSY', // 'IDLE', 'BUSY'
      activeRequestId: 'REQ-101',
      queue: [
        { id: 'REQ-102', processId: 'P2', processName: 'Compiler', operation: 'Write debug_symbols.log', durationTicks: 2, remainingTicks: 2, color: '#4878DF' },
        { id: 'REQ-103', processId: 'P3', processName: 'Web Browser', operation: 'Print Ticket.pdf', durationTicks: 4, remainingTicks: 4, color: '#32A86E' },
      ],
      currentProcessing: {
        id: 'REQ-101',
        processId: 'P1',
        processName: 'Text Editor',
        operation: 'Print Report.pdf',
        durationTicks: 3,
        remainingTicks: 3,
        color: '#8468E8',
      },
      completed: [],
      nextReqNumber: 104,
      totalServed: 0,
    },
    stepNumber: 1,
    action: 'Device Initialized',
    explanation: {
      what: 'Printer device initialized with REQ-101 actively servicing, while REQ-102 and REQ-103 wait in the I/O queue.',
      why: 'Physical peripheral devices cannot be accessed concurrently without corrupting output or colliding mechanical heads.',
      changed: 'Device state set to BUSY with REQ-101. Two requests queued in FIFO order.',
      learned: 'I/O request queues serialize device operations, allowing applications to submit requests asynchronously without blocking user input.',
    },
  };
}

export function addIoRequest(currentSnapshot, processName, operation, duration = 3) {
  const { state } = currentSnapshot;
  const reqId = `REQ-${state.nextReqNumber}`;
  const colors = ['#8468E8', '#4878DF', '#32A86E', '#E8773E', '#DB5483'];
  const color = colors[state.nextReqNumber % colors.length];

  const newReq = {
    id: reqId,
    processId: `P${state.nextReqNumber - 100}`,
    processName: processName || 'Application',
    operation: operation || 'I/O Transfer',
    durationTicks: duration,
    remainingTicks: duration,
    color,
  };

  if (!state.currentProcessing) {
    // Device is idle: dispatch immediately
    return {
      state: {
        ...state,
        deviceStatus: 'BUSY',
        currentProcessing: newReq,
        activeRequestId: reqId,
        nextReqNumber: state.nextReqNumber + 1,
      },
      action: `Dispatched ${reqId} Immediately`,
      explanation: {
        what: `Request ${reqId} (${newReq.operation}) dispatched directly to the idle ${state.deviceType}.`,
        why: 'Because the device queue was empty, no buffering delay was incurred.',
        changed: `Device state transitioned from IDLE to BUSY with ${reqId}.`,
        learned: 'When hardware resources are unconstrained, I/O dispatch is near-instantaneous.',
      },
    };
  }

  // Device is busy: append to queue
  return {
    state: {
      ...state,
      queue: [...state.queue, newReq],
      nextReqNumber: state.nextReqNumber + 1,
    },
    action: `Queued ${reqId}`,
    explanation: {
      what: `Request ${reqId} for ${newReq.processName} added to the back of the I/O request queue.`,
      why: `The device is busy servicing ${state.currentProcessing.id}. Simultaneous access would corrupt the output stream.`,
      changed: `Queue length increased to ${state.queue.length + 1}.`,
      learned: 'Queuing ensures FIFO fairness and prevents mechanical conflicts in physical hardware.',
    },
  };
}

export function switchDeviceType(currentSnapshot, newDeviceType) {
  const { state } = currentSnapshot;
  return {
    state: {
      ...state,
      deviceType: newDeviceType,
    },
    action: `Switched Device to ${newDeviceType}`,
    explanation: {
      what: `Simulated hardware switched to ${DEVICE_TYPES[newDeviceType].name}.`,
      why: 'Operating systems use generalized device driver abstractions for different physical hardware.',
      changed: `Active device model updated to ${DEVICE_TYPES[newDeviceType].name}.`,
      learned: 'Uniform device interfaces allow the operating system to treat disks, printers, and network cards with common queue primitives.',
    },
  };
}

export function advanceIoStep(currentSnapshot) {
  const { state } = currentSnapshot;

  if (state.currentProcessing) {
    const current = { ...state.currentProcessing };
    current.remainingTicks -= 1;

    if (current.remainingTicks <= 0) {
      // Completed current request!
      const completedList = [
        { ...current, completedAtStep: currentSnapshot.stepNumber + 1 },
        ...state.completed,
      ];

      // Check if another request is in queue
      if (state.queue.length > 0) {
        const [nextReq, ...remainingQueue] = state.queue;
        return {
          state: {
            ...state,
            deviceStatus: 'BUSY',
            currentProcessing: nextReq,
            activeRequestId: nextReq.id,
            queue: remainingQueue,
            completed: completedList,
            totalServed: state.totalServed + 1,
          },
          action: `${current.id} Completed -> Started ${nextReq.id}`,
          explanation: {
            what: `${current.id} (${current.operation}) finished servicing. OS dispatched ${nextReq.id} from queue.`,
            why: 'Hardware controller sent an I/O completion interrupt, prompting the device driver to pop the next pending request.',
            changed: `${current.id} moved to Completed list; ${nextReq.id} is now actively processing.`,
            learned: 'I/O completion interrupts signal the OS to wake the waiting process and advance the hardware queue.',
          },
        };
      } else {
        // Queue empty: device goes IDLE
        return {
          state: {
            ...state,
            deviceStatus: 'IDLE',
            currentProcessing: null,
            activeRequestId: null,
            completed: completedList,
            totalServed: state.totalServed + 1,
          },
          action: `${current.id} Completed -> Device IDLE`,
          explanation: {
            what: `${current.id} finished servicing. The queue is now empty.`,
            why: 'No other processes have submitted pending I/O requests.',
            changed: 'Device state transitioned to IDLE.',
            learned: 'Idle devices consume less power and remain ready for future application system calls.',
          },
        };
      }
    } else {
      // Still servicing current
      return {
        state: {
          ...state,
          currentProcessing: current,
        },
        action: `Servicing ${current.id}`,
        explanation: {
          what: `Device is servicing ${current.id} (${current.remainingTicks} time units remaining).`,
          why: 'Mechanical or physical data transfer requires sustained clock ticks to finish.',
          changed: `Progress advanced by 1 unit for ${current.id}.`,
          learned: 'While the device controller works in the background, the CPU core is free to run other unrelated programs.',
        },
      };
    }
  } else if (state.queue.length > 0) {
    const [nextReq, ...remainingQueue] = state.queue;
    return {
      state: {
        ...state,
        deviceStatus: 'BUSY',
        currentProcessing: nextReq,
        activeRequestId: nextReq.id,
        queue: remainingQueue,
      },
      action: `Started ${nextReq.id}`,
      explanation: {
        what: `Device started servicing ${nextReq.id} from queue.`,
        why: 'Hardware became ready to receive the next transmission block.',
        changed: `Queue length decreased; ${nextReq.id} set to actively processing.`,
        learned: 'Device drivers schedule requests systematically to ensure maximum device utilization.',
      },
    };
  }

  // Nothing to process, generate new request for demo continuity
  return addIoRequest(currentSnapshot, 'Background Service', 'Flush File Buffer', 3);
}
