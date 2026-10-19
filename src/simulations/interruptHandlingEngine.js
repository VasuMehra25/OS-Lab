// Hardware & Software Interrupt Handling Simulation Engine

export const INTERRUPT_STAGES = [
  {
    stageId: 0,
    name: 'Normal User Execution',
    activeComponent: 'CPU_USER',
    badge: 'User Space',
    color: '#8468E8',
    description: 'CPU is executing user application instructions (VideoGame.exe). Program Counter (PC) points to 0x004012A0.',
  },
  {
    stageId: 1,
    name: 'Hardware Interrupt Triggered',
    activeComponent: 'DEVICE',
    badge: 'Hardware Bus',
    color: '#E8773E',
    description: 'Hardware peripheral asserts the Interrupt Request Line (IRQ line) on the system bus.',
  },
  {
    stageId: 2,
    name: 'Instruction Boundary Check',
    activeComponent: 'CPU_CONTROL',
    badge: 'CPU Hardware',
    color: '#4878DF',
    description: 'CPU finishes current machine cycle; interrupts are evaluated at instruction boundaries before fetching the next opcode.',
  },
  {
    stageId: 3,
    name: 'State Saving to Stack',
    activeComponent: 'STACK',
    badge: 'System Stack',
    color: '#DB5483',
    description: 'Hardware automatically pushes Program Counter (PC), Flags, and general-purpose registers onto the System Call Stack.',
  },
  {
    stageId: 4,
    name: 'IVT Vector Lookup',
    activeComponent: 'IVT',
    badge: 'Vector Table',
    color: '#D99614',
    description: 'CPU queries Interrupt Vector Table (IVT) using IRQ number to find the memory address of the corresponding handler routine.',
  },
  {
    stageId: 5,
    name: 'Execute ISR (System Mode)',
    activeComponent: 'ISR',
    badge: 'Driver ISR',
    color: '#32A86E',
    description: 'CPU switches to supervisor privilege mode and executes the Interrupt Service Routine (device driver code).',
  },
  {
    stageId: 6,
    name: 'Context Restoration (IRET)',
    activeComponent: 'STACK',
    badge: 'CPU Restore',
    color: '#4878DF',
    description: 'ISR executes IRET instruction. CPU pops original Program Counter and register state from the system stack.',
  },
  {
    stageId: 7,
    name: 'Resuming User Application',
    activeComponent: 'CPU_USER',
    badge: 'User Space',
    color: '#8468E8',
    description: 'Original user program resumes at the exact instruction where it was paused, completely unaware of the interruption.',
  },
];

export const AVAILABLE_INTERRUPTS = [
  { id: 'IRQ_KEYBOARD', irqNumber: 1, name: 'Keyboard Keystroke (Key "Enter")', device: 'Keyboard Controller', isrAddress: '0x80041000' },
  { id: 'IRQ_DISK', irqNumber: 14, name: 'Disk Read Complete (DMA Transfer)', device: 'SATA/NVMe Host Controller', isrAddress: '0x80042400' },
  { id: 'IRQ_TIMER', irqNumber: 0, name: 'System Timer Tick (10ms Quantum)', device: 'Programmable Interval Timer', isrAddress: '0x80040200' },
  { id: 'IRQ_NIC', irqNumber: 11, name: 'Network Packet Arrived', device: 'Ethernet NIC', isrAddress: '0x80043800' },
];

export function getInitialInterruptSnapshot() {
  return {
    state: {
      currentStageIndex: 0,
      selectedInterrupt: AVAILABLE_INTERRUPTS[0],
      cpuRegisters: {
        PC: '0x004012A0',
        EAX: '0x0000002A',
        EBX: '0x7FFDF000',
        Flags: '0x00000246 (IF=1)',
      },
      savedStack: [],
      executionLog: ['CPU executing User App VideoGame.exe in Ring 3 (User Mode).'],
    },
    stepNumber: 1,
    action: 'Normal Execution',
    explanation: {
      what: 'User application VideoGame.exe is executing instructions in User Space (Ring 3).',
      why: 'In normal operation, the CPU executes instruction fetch-decode-execute cycles continuously.',
      changed: 'CPU Program Counter (PC) = 0x004012A0. Stack pointer is at normal user space.',
      learned: 'Interrupts decouple CPU speed from peripheral speed: devices notify the CPU only when events occur.',
    },
  };
}

export function triggerInterrupt(currentSnapshot, interruptId) {
  const chosen = AVAILABLE_INTERRUPTS.find((i) => i.id === interruptId) || AVAILABLE_INTERRUPTS[0];
  const { state } = currentSnapshot;

  return {
    state: {
      ...state,
      selectedInterrupt: chosen,
      currentStageIndex: 1,
      executionLog: [
        `[HARDWARE SIGNAL] ${chosen.device} raised IRQ #${chosen.irqNumber} (${chosen.name}).`,
        ...state.executionLog.slice(0, 8),
      ],
    },
    action: `Triggered IRQ #${chosen.irqNumber}`,
    explanation: {
      what: `Hardware interrupt triggered by ${chosen.device} (IRQ #${chosen.irqNumber}).`,
      why: 'The peripheral controller completed an action or detected user input that requires OS processing.',
      changed: `Interrupt pin asserted on CPU bus. IRQ #${chosen.irqNumber} signaled.`,
      learned: 'Hardware interrupts are asynchronous: they can arrive at any arbitrary moment during execution.',
    },
  };
}

export function advanceInterruptStep(currentSnapshot) {
  const { state } = currentSnapshot;
  const nextStageIndex = (state.currentStageIndex + 1) % INTERRUPT_STAGES.length;
  const stage = INTERRUPT_STAGES[nextStageIndex];
  const irq = state.selectedInterrupt;
  let savedStack = [...state.savedStack];
  let cpuRegisters = { ...state.cpuRegisters };
  let logs = [...state.executionLog];

  let what = '';
  let why = '';
  let changed = '';
  let learned = '';

  switch (nextStageIndex) {
    case 0: // Normal execution
      what = 'User application returned to active execution.';
      why = 'All interrupt handling steps completed; CPU resumed normal instruction pipeline.';
      changed = 'CPU mode: Ring 3 User Space. PC restored to original address.';
      learned: 'The application code is completely unaware that it was temporarily paused.';
      logs.unshift('User application running normally.');
      break;

    case 1: // Hardware interrupt
      what = `${irq.device} triggered IRQ #${irq.irqNumber} on the system interrupt controller.`;
      why = 'The device has data ready in its local hardware buffer.',
      changed = 'Interrupt flag detected by CPU interrupt controller (PIC/APIC).';
      learned = 'Interrupt lines signal the CPU via hardware pins without polling.';
      logs.unshift(`IRQ #${irq.irqNumber} signaled on bus.`);
      break;

    case 2: // Instruction boundary
      what = 'CPU completed current instruction execution cycle.';
      why = 'CPUs never interrupt an instruction in the middle; they finish the current opcode to maintain architectural integrity.';
      changed = 'CPU acknowledged interrupt; halted fetching next user instruction.';
      learned = 'Precise interrupts ensure CPU registers remain in a consistent, restartable state.';
      logs.unshift('CPU reached instruction boundary.');
      break;

    case 3: // Save state to stack
      savedStack = [
        { reg: 'PC', val: cpuRegisters.PC },
        { reg: 'Flags', val: cpuRegisters.Flags },
        { reg: 'EAX', val: cpuRegisters.EAX },
        { reg: 'EBX', val: cpuRegisters.EBX },
      ];
      what = 'CPU pushed PC (0x004012A0) and registers onto the System Call Stack.';
      why = 'To return later, the exact CPU register values must be preserved in memory.';
      changed = `System stack saved 4 register frames: PC, Flags, EAX, EBX.`;
      learned = 'Saving state is essential: without saving PC and flags, the CPU would lose its place forever.';
      logs.unshift('Saved PC and registers to System Stack.');
      break;

    case 4: // IVT lookup
      cpuRegisters.PC = irq.isrAddress;
      what = `CPU checked Interrupt Vector Table entry #${irq.irqNumber}.`;
      why = 'The vector table maps hardware IRQ numbers directly to handler function memory addresses.';
      changed = `Program Counter (PC) loaded with ISR address: ${irq.isrAddress}.`;
      learned = 'The Interrupt Vector Table allows operating systems to register custom device drivers cleanly.';
      logs.unshift(`IVT mapped IRQ #${irq.irqNumber} -> ${irq.isrAddress}.`);
      break;

    case 5: // Execute ISR
      what = `Executing ISR (${irq.name}) in privileged System Mode.`;
      why = 'The device driver reads buffer bytes and acknowledges the hardware controller.';
      changed = 'CPU privilege level elevated to System Mode; hardware device buffer drained.';
      learned = 'ISRs must execute quickly to avoid delaying other high-priority interrupts.';
      logs.unshift(`Executed ISR handler at ${irq.isrAddress}.`);
      break;

    case 6: // IRET & Stack pop
      cpuRegisters.PC = '0x004012A0';
      savedStack = [];
      what = 'ISR executed IRET (Interrupt Return) instruction.';
      why = 'IRET pops saved registers and restores previous CPU privilege levels in a single atomic hardware operation.';
      changed = 'Popped PC and registers from System Stack back into hardware registers.';
      learned = 'The atomic IRET instruction guarantees seamless return without register corruption.';
      logs.unshift('IRET executed. Registers popped from stack.');
      break;

    case 7: // Resume
      what = 'User application resumed at PC = 0x004012A0.';
      why = 'Hardware state has been fully restored to the pre-interrupt condition.';
      changed = 'Execution resumed smoothly in user space.';
      learned = 'Transparency is a core OS principle: user programs do not need to know when hardware interrupts take place.';
      logs.unshift('User program resumed successfully.');
      break;

    default:
      break;
  }

  return {
    state: {
      ...state,
      currentStageIndex: nextStageIndex,
      cpuRegisters,
      savedStack,
      executionLog: logs.slice(0, 10),
    },
    action: stage.name,
    explanation: { what, why, changed, learned },
  };
}
