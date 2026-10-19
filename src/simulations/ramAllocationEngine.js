// RAM Allocation & First-Fit Engine

export const BLOCK_SIZE_KB = 32;
export const TOTAL_BLOCKS = 16;
export const TOTAL_RAM_KB = BLOCK_SIZE_KB * TOTAL_BLOCKS; // 512 KB

export function getInitialRamSnapshot() {
  const blocks = Array.from({ length: TOTAL_BLOCKS }, (_, index) => ({
    blockId: index,
    processId: null,
    processName: null,
    color: null,
  }));

  const allocatedProcesses = [];

  return {
    state: {
      blocks,
      allocatedProcesses,
      totalRamKb: TOTAL_RAM_KB,
      usedRamKb: 0,
      freeRamKb: TOTAL_RAM_KB,
      blockSizeKb: BLOCK_SIZE_KB,
      externalFragmentation: false,
      lastAction: 'RAM Initialized',
      demoStep: 0,
    },
    stepNumber: 1,
    action: 'RAM Initialized',
    explanation: {
      what: 'Physical RAM initialized with 512 KB partitioned into 16 discrete 32 KB blocks.',
      why: 'Processes request contiguous memory blocks from this address pool.',
      changed: 'All 16 memory blocks are free and available for allocation.',
      learned: 'Contiguous allocation algorithms like First-Fit place incoming jobs into the earliest fitting free hole.',
    },
  };
}

/**
 * First-Fit Allocation Algorithm
 */
export function allocateFirstFit(currentSnapshot, processName, requestedKb, colorOverride) {
  const { state } = currentSnapshot;
  const blocksNeeded = Math.ceil(requestedKb / BLOCK_SIZE_KB);
  const blocks = state.blocks.map((b) => ({ ...b }));
  
  // Scan for first contiguous free segment of length blocksNeeded
  let runStart = -1;
  let runLength = 0;

  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    if (blocks[i].processId === null) {
      if (runStart === -1) runStart = i;
      runLength += 1;
      if (runLength === blocksNeeded) {
        break;
      }
    } else {
      runStart = -1;
      runLength = 0;
    }
  }

  const pid = `P${state.allocatedProcesses.length + 1}`;
  const name = processName || `Process ${pid}`;
  
  const colors = ['#8468E8', '#4878DF', '#32A86E', '#E8773E', '#DB5483', '#EAB308'];
  const color = colorOverride || colors[state.allocatedProcesses.length % colors.length];

  // Total free blocks check
  const totalFreeBlocks = blocks.filter((b) => b.processId === null).length;

  if (runLength < blocksNeeded) {
    // Cannot find contiguous hole
    const isExternalFragmentation = totalFreeBlocks >= blocksNeeded;

    return {
      state: {
        ...state,
        externalFragmentation: isExternalFragmentation,
        lastAction: `Failed to allocate ${name} (${requestedKb} KB)`,
      },
      action: `Allocation Failed: ${name}`,
      explanation: {
        what: `Cannot allocate ${requestedKb} KB (${blocksNeeded} contiguous blocks) for ${name}.`,
        why: isExternalFragmentation
          ? `External Fragmentation! Total free RAM is ${totalFreeBlocks * BLOCK_SIZE_KB} KB, but it is broken into non-contiguous holes smaller than ${requestedKb} KB.`
          : `Out of Memory: Physical RAM is exhausted. Only ${totalFreeBlocks * BLOCK_SIZE_KB} KB free.`,
        changed: 'No memory blocks were modified.',
        learned: isExternalFragmentation
          ? 'External fragmentation occurs when small free holes are separated by allocated blocks, requiring memory compaction or paging.'
          : 'When memory is full, the OS must swap processes out to disk or deny the allocation request.',
      },
    };
  }

  // Allocate blocks
  for (let i = runStart; i < runStart + blocksNeeded; i++) {
    blocks[i] = {
      blockId: i,
      processId: pid,
      processName: name,
      color,
    };
  }

  const internalFrag = (blocksNeeded * BLOCK_SIZE_KB) - requestedKb;

  const newProc = {
    id: pid,
    name,
    blocksUsed: blocksNeeded,
    requestedKb,
    startBlock: runStart,
    internalFragKb: internalFrag,
    color,
  };

  const updatedAllocated = [...state.allocatedProcesses, newProc];
  const usedRamKb = updatedAllocated.reduce((sum, p) => sum + p.blocksUsed * BLOCK_SIZE_KB, 0);
  const freeRamKb = TOTAL_RAM_KB - usedRamKb;

  return {
    state: {
      ...state,
      blocks,
      allocatedProcesses: updatedAllocated,
      usedRamKb,
      freeRamKb,
      externalFragmentation: false,
      lastAction: `Allocated ${name} (${requestedKb} KB) at Block ${runStart}`,
    },
    action: `Allocated ${pid} (${requestedKb} KB)`,
    explanation: {
      what: `Allocated ${blocksNeeded} blocks (${blocksNeeded * BLOCK_SIZE_KB} KB) starting at Block ${runStart} for ${name}.`,
      why: `First-Fit scanned RAM from Block 0 and chose the first free hole large enough for ${requestedKb} KB.`,
      changed: `Blocks ${runStart} to ${runStart + blocksNeeded - 1} are now owned by ${name}. Free RAM is now ${freeRamKb} KB.`,
      learned: internalFrag > 0
        ? `Internal fragmentation: ${name} asked for ${requestedKb} KB but occupied ${blocksNeeded * BLOCK_SIZE_KB} KB, leaving ${internalFrag} KB unused in the partition.`
        : 'First-Fit is fast because it stops scanning as soon as it finds the first matching hole.',
    },
  };
}

/**
 * Release Process Memory
 */
export function releaseProcess(currentSnapshot, processId) {
  const { state } = currentSnapshot;
  const proc = state.allocatedProcesses.find((p) => p.id === processId);

  if (!proc) {
    return currentSnapshot;
  }

  const blocks = state.blocks.map((b) => {
    if (b.processId === processId) {
      return { blockId: b.blockId, processId: null, processName: null, color: null };
    }
    return { ...b };
  });

  const updatedAllocated = state.allocatedProcesses.filter((p) => p.id !== processId);
  const usedRamKb = updatedAllocated.reduce((sum, p) => sum + p.blocksUsed * BLOCK_SIZE_KB, 0);
  const freeRamKb = TOTAL_RAM_KB - usedRamKb;

  return {
    state: {
      ...state,
      blocks,
      allocatedProcesses: updatedAllocated,
      usedRamKb,
      freeRamKb,
      externalFragmentation: false,
      lastAction: `Released ${proc.name}`,
    },
    action: `Released ${proc.id}`,
    explanation: {
      what: `Process ${proc.id} (${proc.name}) was terminated and its ${proc.blocksUsed * BLOCK_SIZE_KB} KB RAM reclaimed.`,
      why: 'When a process calls exit() or is killed, the OS immediately marks its memory blocks as free.',
      changed: `Blocks ${proc.startBlock} through ${proc.startBlock + proc.blocksUsed - 1} returned to the free pool.`,
      learned: 'Releasing non-adjacent processes creates "holes" in physical RAM, which may lead to external fragmentation.',
    },
  };
}

/**
 * Preset step generator for Next Step / Auto Play
 */
export function getNextRamAllocationStep(currentSnapshot) {
  const step = currentSnapshot.state.demoStep || 0;
  
  // Guided curriculum sequence demonstrating First-Fit and External Fragmentation:
  // Step 0: Initial state
  // Step 1: Allocate P1 (96 KB - 3 blocks)
  // Step 2: Allocate P2 (64 KB - 2 blocks)
  // Step 3: Allocate P3 (128 KB - 4 blocks)
  // Step 4: Allocate P4 (64 KB - 2 blocks)
  // Step 5: Deallocate P2 (creates a 64 KB hole at blocks 5-6!)
  // Step 6: Deallocate P4 (creates a 64 KB hole at blocks 11-12!)
  // Step 7: Try Allocate P5 (96 KB - 3 blocks) -> Demonstrates external fragmentation! 128 KB free total, but max hole is 64 KB!
  // Step 8: Allocate P6 (64 KB) -> Fits into the first free hole (First-Fit)!

  switch (step) {
    case 0: {
      const snap = allocateFirstFit(currentSnapshot, 'Browser Tab', 96, '#8468E8');
      snap.state.demoStep = 1;
      return snap;
    }
    case 1: {
      const snap = allocateFirstFit(currentSnapshot, 'Database Engine', 64, '#4878DF');
      snap.state.demoStep = 2;
      return snap;
    }
    case 2: {
      const snap = allocateFirstFit(currentSnapshot, 'Photo Editor', 128, '#32A86E');
      snap.state.demoStep = 3;
      return snap;
    }
    case 3: {
      const snap = allocateFirstFit(currentSnapshot, 'Chat Client', 64, '#E8773E');
      snap.state.demoStep = 4;
      return snap;
    }
    case 4: {
      // Release P2 (Database Engine)
      const snap = releaseProcess(currentSnapshot, 'P2');
      snap.state.demoStep = 5;
      return snap;
    }
    case 5: {
      // Release P4 (Chat Client)
      const snap = releaseProcess(currentSnapshot, 'P4');
      snap.state.demoStep = 6;
      return snap;
    }
    case 6: {
      // Try allocating P5 requiring 96 KB (needs 3 contiguous blocks).
      // Free holes: Blocks 5-6 (64 KB), Blocks 11-12 (64 KB), Blocks 13-15 (96 KB).
      // Wait, blocks 13-15 are free! Let's allocate 128 KB (4 blocks) so that neither hole can fit it even though 128 KB is free total!
      const snap = allocateFirstFit(currentSnapshot, 'Video Game Engine', 128, '#DB5483');
      snap.state.demoStep = 7;
      return snap;
    }
    case 7: {
      // Allocate P6 (64 KB): First-Fit puts it into the first hole (Block 5-6)!
      const snap = allocateFirstFit(currentSnapshot, 'Audio Stream', 64, '#EAB308');
      snap.state.demoStep = 8;
      return snap;
    }
    default:
      return null;
  }
}
