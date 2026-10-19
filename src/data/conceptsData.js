// OS Inside — Concepts Data Specification

export const CATEGORIES = [
  {
    id: 'process-management',
    title: 'Process Management',
    shortDescription: 'How operating systems create, schedule, synchronize, and terminate programs in execution.',
    iconName: 'Cpu',
    colorKey: 'green',
    accentBg: 'var(--pastel-green-bg)',
    accentBorder: 'var(--pastel-green-border)',
    accentColor: 'var(--pastel-green-accent)',
    accentText: 'var(--pastel-green-text)',
    concepts: ['process-lifecycle', 'cpu-scheduling'],
  },
  {
    id: 'memory-management',
    title: 'Memory Management',
    shortDescription: 'How the OS allocates physical RAM to active processes and abstracts storage with virtual paging.',
    iconName: 'Layers',
    colorKey: 'amber',
    accentBg: 'var(--pastel-amber-bg)',
    accentBorder: 'var(--pastel-amber-border)',
    accentColor: 'var(--pastel-amber-accent)',
    accentText: 'var(--pastel-amber-text)',
    concepts: ['ram-allocation', 'virtual-memory'],
  },
  {
    id: 'device-management',
    title: 'Device Management',
    shortDescription: 'How the OS coordinates hardware communication, buffers I/O queues, and responds to hardware interrupts.',
    iconName: 'HardDrive',
    colorKey: 'green',
    accentBg: 'var(--pastel-green-bg)',
    accentBorder: 'var(--pastel-green-border)',
    accentColor: 'var(--pastel-green-accent)',
    accentText: 'var(--pastel-green-text)',
    concepts: ['io-queue', 'interrupt-handling'],
  },
  {
    id: 'information-management',
    title: 'Information Management',
    shortDescription: 'How data is organized into hierarchical virtual files, directories, and secured through permissions.',
    iconName: 'FolderTree',
    colorKey: 'amber',
    accentBg: 'var(--pastel-amber-bg)',
    accentBorder: 'var(--pastel-amber-border)',
    accentColor: 'var(--pastel-amber-accent)',
    accentText: 'var(--pastel-amber-text)',
    concepts: ['file-system', 'file-permissions'],
  },
];

export const CONCEPTS = {
  'process-lifecycle': {
    id: 'process-lifecycle',
    categoryId: 'process-management',
    categoryTitle: 'Process Management',
    title: 'Process Lifecycle & State Transitions',
    path: '/learn/process-lifecycle',
    shortDescription: 'Step through the 5 classic process states: New, Ready, Running, Waiting/Blocked, and Terminated.',
    badge: 'Core Concept',
    colorKey: 'green',
    detailedIntro:
      'A process is an active program in execution. The operating system moves processes through discrete states to maximize CPU utilization and handle external events like user input and disk reads.',
    whyItMatters:
      'Modern computers run hundreds of background tasks and user apps concurrently on limited CPU cores. The OS process state machine prevents starved processes and ensures smooth multitasking.',
    keyTakeaway:
      'Only one process per CPU core can be in the "Running" state at any instant. When a process requests I/O, it enters "Waiting" so another "Ready" process can use the CPU.',
    knowledgeCheck: {
      question: 'When a running process requests data from a slow hard drive, which state does the OS transition it to?',
      options: [
        'Terminated (the process stops completely)',
        'Ready (it immediately waits for another CPU slice)',
        'Waiting / Blocked (it yields the CPU until the I/O transfer completes)',
        'New (the process is re-instantiated from scratch)',
      ],
      correctIndex: 2,
      explanation:
        'Correct! Because I/O devices are thousands of times slower than the CPU, the OS moves the process to Waiting/Blocked. This frees up the CPU core for other Ready processes.',
    },
  },

  'cpu-scheduling': {
    id: 'cpu-scheduling',
    categoryId: 'process-management',
    categoryTitle: 'Process Management',
    title: 'CPU Scheduling Algorithms',
    path: '/learn/cpu-scheduling',
    shortDescription: 'Compare First-Come First-Served (FCFS) and preemptive Round Robin (RR) with dynamic Gantt charts.',
    badge: 'Interactive Simulator',
    colorKey: 'green',
    detailedIntro:
      'When multiple processes are Ready to execute, the CPU scheduler decides who gets the processor next. Algorithms balance turnaround time, fairness, and system responsiveness.',
    whyItMatters:
      'Without intelligent scheduling, a single heavy task could freeze the entire operating system, leaving interactive applications unresponsive.',
    keyTakeaway:
      'FCFS is simple but suffers from the "convoy effect" where short jobs wait behind long jobs. Round Robin provides fair time slices (quantums) so interactive tasks feel immediate.',
    knowledgeCheck: {
      question: 'What is the primary benefit of Round Robin scheduling over First-Come First-Served?',
      options: [
        'It eliminates all context switching overhead',
        'It prevents short interactive jobs from being stuck waiting behind long-running compute jobs',
        'It always produces the lowest possible average turnaround time for any workload',
        'It executes processes without requiring any CPU registers',
      ],
      correctIndex: 1,
      explanation:
        'Correct! By giving each process a fixed time slice (quantum) and preempting long jobs, Round Robin guarantees all processes make steady forward progress.',
    },
  },

  'ram-allocation': {
    id: 'ram-allocation',
    categoryId: 'memory-management',
    categoryTitle: 'Memory Management',
    title: 'RAM Allocation & Fragmentation',
    path: '/learn/ram-allocation',
    shortDescription: 'Visualize physical memory partitions, allocate and release blocks, and observe external fragmentation.',
    badge: 'Visual Grid',
    colorKey: 'amber',
    detailedIntro:
      'The operating system must partition physical RAM among concurrent programs. When processes start and terminate, free blocks can become scattered, leading to fragmentation.',
    whyItMatters:
      'Even if a computer has 100 MB of total free memory, if it is fragmented into ten 10 MB holes, a process requiring 20 MB contiguous memory will fail without compaction or paging.',
    keyTakeaway:
      'First-Fit scans memory from the beginning and allocates the first hole that is large enough. Over time, dynamic allocations and deallocations lead to external fragmentation.',
    knowledgeCheck: {
      question: 'What is "external fragmentation" in physical memory allocation?',
      options: [
        'Wasted memory inside an allocated partition that a process did not use',
        'Physical RAM chips that are damaged by external electrical surges',
        'Total free memory is sufficient to satisfy a request, but the memory is non-contiguous and split into small scattered holes',
        'System memory reserved for hardware firmware that programs cannot directly address',
      ],
      correctIndex: 2,
      explanation:
        'Correct! External fragmentation occurs when free memory is broken into many small scattered blocks, none of which is large enough individually to fit a new process.',
    },
  },

  'virtual-memory': {
    id: 'virtual-memory',
    categoryId: 'memory-management',
    categoryTitle: 'Memory Management',
    title: 'Virtual Memory & Demand Paging',
    path: '/learn/virtual-memory',
    shortDescription: 'Trace virtual page requests, page table lookups, page faults, and FIFO frame eviction.',
    badge: 'Paging Engine',
    colorKey: 'amber',
    detailedIntro:
      'Virtual memory provides each process with the illusion of a large, continuous address space. Pages are loaded into physical frames only when referenced (demand paging).',
    whyItMatters:
      'Virtual memory allows computers to run applications much larger than physical RAM and isolates programs from accidentally corrupting each other’s memory.',
    keyTakeaway:
      'When a requested page is not in physical RAM, the MMU signals a Page Fault. The OS pauses the process, loads the page from secondary storage into an available frame, and resumes execution.',
    knowledgeCheck: {
      question: 'What occurs when a process attempts to access a virtual page that has its Valid bit set to 0 in the Page Table?',
      options: [
        'A Page Hit occurs and the CPU accesses RAM immediately',
        'A Page Fault is triggered, causing the OS to fetch the page from storage into a RAM frame',
        'The process is immediately terminated for an illegal instruction',
        'The physical RAM is wiped and rebooted',
      ],
      correctIndex: 1,
      explanation:
        'Correct! A Valid bit of 0 means the page is currently on disk or unmapped. The CPU raises a Page Fault interrupt so the OS can load it into an available frame.',
    },
  },

  'io-queue': {
    id: 'io-queue',
    categoryId: 'device-management',
    categoryTitle: 'Device Management',
    title: 'I/O Request Queue Management',
    path: '/learn/io-queue',
    shortDescription: 'Observe how devices buffer incoming read/write requests and service them sequentially without blocking the CPU.',
    badge: 'Hardware Queue',
    colorKey: 'green',
    detailedIntro:
      'Hardware peripherals like hard drives, solid-state disks, and printers are fundamentally slower than CPUs. Operating systems use request queues and device drivers to mediate access.',
    whyItMatters:
      'Without an I/O subsystem queue, concurrent programs attempting to print or write to disk simultaneously would interleave corrupted data or freeze awaiting mechanical hardware.',
    keyTakeaway:
      'The OS device driver buffers requests in an I/O queue. The device services requests one by one while the CPU continues running other applications.',
    knowledgeCheck: {
      question: 'Why do operating systems maintain separate I/O request queues for peripheral devices?',
      options: [
        'To force the CPU to slow down to match the printer mechanical speed',
        'To prevent conflicting simultaneous access and allow the CPU to run other tasks while requests wait their turn',
        'Because devices do not support binary electrical signals',
        'To permanently store deleted files before emptying the trash',
      ],
      correctIndex: 1,
      explanation:
        'Correct! The I/O queue serializes access to physical devices so concurrent processes do not collide, freeing the CPU to execute instructions in parallel.',
    },
  },

  'interrupt-handling': {
    id: 'interrupt-handling',
    categoryId: 'device-management',
    categoryTitle: 'Device Management',
    title: 'Hardware & Software Interrupt Handling',
    path: '/learn/interrupt-handling',
    shortDescription: 'Trace the CPU execution cycle as an asynchronous hardware interrupt triggers context saving, ISR execution, and resumption.',
    badge: 'Timeline Trace',
    colorKey: 'green',
    detailedIntro:
      'Interrupts are signals sent by hardware or software alerting the CPU to an event needing immediate attention. The CPU pauses current instruction execution at an instruction boundary, saves state, and runs an Interrupt Service Routine (ISR).',
    whyItMatters:
      'Instead of wasting CPU cycles in busy-waiting polling loops ("is the key pressed yet?"), devices interrupt the CPU only when data is genuinely ready.',
    keyTakeaway:
      'Interrupts allow efficient event-driven computing. The OS saves the program counter (PC) and registers, invokes the vector table ISR, and cleanly restores execution.',
    knowledgeCheck: {
      question: 'What is the crucial first step the CPU/OS takes immediately when an interrupt occurs during user program execution?',
      options: [
        'Delete the user program from memory',
        'Save the current execution state (Program Counter and CPU registers) to the stack',
        'Reboot the peripheral hardware controller',
        'Notify the user with a desktop popup',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Saving registers and the Program Counter guarantees that once the Interrupt Service Routine finishes, the interrupted process can resume exactly where it left off without data loss.',
    },
  },

  'file-system': {
    id: 'file-system',
    categoryId: 'information-management',
    categoryTitle: 'Information Management',
    title: 'File System Explorer & Inode Tree',
    path: '/learn/file-system',
    shortDescription: 'Explore hierarchical directory structures, file metadata, simulated storage block allocations, and CRUD operations.',
    badge: 'Virtual Tree',
    colorKey: 'amber',
    detailedIntro:
      'A file system organizes raw storage blocks into human-readable files and hierarchical folders. It tracks metadata like file size, modification timestamp, and disk block pointers.',
    whyItMatters:
      'Without a file system, a storage disk is just billions of unlabelled binary bytes. The file system creates structure, directories, and paths so data can be located and updated safely.',
    keyTakeaway:
      'Directories are special files containing tables of filenames mapped to inode numbers or block addresses. Creating or deleting a file updates both directory entries and storage allocation tables.',
    knowledgeCheck: {
      question: 'In an operating system file system, what is the primary role of a directory (folder)?',
      options: [
        'To speed up CPU clock frequency',
        'To act as a special index file that maps human-readable names to file identifiers (such as inodes or block pointers)',
        'To encrypt all user passwords automatically',
        'To store backup copies of the motherboard BIOS',
      ],
      correctIndex: 1,
      explanation:
        'Correct! A directory is conceptually a table that associates friendly names (like "document.txt") with metadata pointers (like inode #1042) that locate the file’s data blocks.',
    },
  },

  'file-permissions': {
    id: 'file-permissions',
    categoryId: 'information-management',
    categoryTitle: 'Information Management',
    title: 'File Permissions & Access Control',
    path: '/learn/file-permissions',
    shortDescription: 'Test Read, Write, and Execute (rwx) permissions across Owner, Group, and Others with an interactive permission validator.',
    badge: 'Access Engine',
    colorKey: 'amber',
    detailedIntro:
      'Operating systems secure sensitive data by enforcing access control matrices. In POSIX systems, permissions are partitioned into three classes: Owner (User), Group, and Others (World), each with Read (4), Write (2), and Execute (1) bits.',
    whyItMatters:
      'Multi-user operating systems and network services depend on permission checks to prevent unauthorized users from viewing confidential files or modifying system binaries.',
    keyTakeaway:
      'When an access request arrives, the OS identifies the user’s identity. It checks whether the user is the Owner; if so, only Owner permissions apply. If not, it checks Group membership; otherwise, Others permissions govern.',
    knowledgeCheck: {
      question: 'What numerical octal permission value corresponds to "rwxr-xr--" (Read/Write/Exec for Owner, Read/Exec for Group, Read-only for Others)?',
      options: [
        '755',
        '754',
        '644',
        '777',
      ],
      correctIndex: 1,
      explanation:
        'Correct! Owner rwx = 4+2+1 = 7. Group r-x = 4+0+1 = 5. Others r-- = 4+0+0 = 4. Together they form octal 754.',
    },
  },
};
