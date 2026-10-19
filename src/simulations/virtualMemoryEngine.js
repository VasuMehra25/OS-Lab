// Virtual Memory & Paging Simulation Engine (FIFO)

export const TOTAL_VIRTUAL_PAGES = 8;
export const TOTAL_PHYSICAL_FRAMES = 4;
export const DEFAULT_PAGE_REFERENCE_STRING = [1, 2, 3, 0, 1, 4, 0, 1, 2, 3];

export function getInitialVirtualMemorySnapshot() {
  const pageTable = Array.from({ length: TOTAL_VIRTUAL_PAGES }, (_, index) => ({
    vpn: index,
    pfn: null,
    valid: false,
  }));

  const frames = Array.from({ length: TOTAL_PHYSICAL_FRAMES }, (_, index) => ({
    frameId: index,
    vpn: null,
    loadOrder: null,
  }));

  return {
    state: {
      pageTable,
      frames,
      fifoQueue: [], // Order of frame indices loaded
      referenceString: [...DEFAULT_PAGE_REFERENCE_STRING],
      currentRefIndex: 0,
      lastRequestedPage: null,
      lastResult: null, // 'HIT' or 'FAULT'
      evictedPage: null,
      evictedFrame: null,
      totalRequests: 0,
      pageHits: 0,
      pageFaults: 0,
    },
    stepNumber: 1,
    action: 'System Ready',
    explanation: {
      what: `Virtual memory initialized with ${TOTAL_VIRTUAL_PAGES} virtual pages and ${TOTAL_PHYSICAL_FRAMES} physical RAM frames.`,
      why: 'Demand paging loads code and data pages into physical RAM only when referenced by the CPU.',
      changed: 'All Page Table valid bits set to 0 (all pages reside on secondary storage/disk).',
      learned: 'Virtual memory isolates processes and permits execution of programs larger than physical RAM.',
    },
  };
}

export function requestPage(currentSnapshot, targetVpn) {
  const { state } = currentSnapshot;
  const pageTable = state.pageTable.map((pt) => ({ ...pt }));
  const frames = state.frames.map((f) => ({ ...f }));
  let fifoQueue = [...state.fifoQueue];
  const newRequestsCount = state.totalRequests + 1;

  const entry = pageTable[targetVpn];

  // Check for PAGE HIT
  if (entry.valid && entry.pfn !== null) {
    const newHits = state.pageHits + 1;
    return {
      state: {
        ...state,
        pageTable,
        frames,
        fifoQueue,
        lastRequestedPage: targetVpn,
        lastResult: 'HIT',
        evictedPage: null,
        evictedFrame: null,
        totalRequests: newRequestsCount,
        pageHits: newHits,
        currentRefIndex: state.currentRefIndex + 1,
      },
      action: `Page Hit: Page ${targetVpn}`,
      explanation: {
        what: `Page Hit! Virtual Page ${targetVpn} is already resident in Physical Frame ${entry.pfn}.`,
        why: 'The CPU Memory Management Unit (MMU) verified that Page Table Valid bit is 1, so data is accessed immediately with zero disk delay.',
        changed: `CPU translated Virtual Page ${targetVpn} -> Physical Frame ${entry.pfn}. Hit counter incremented to ${newHits}.`,
        learned: 'Page hits resolve in nanoseconds inside hardware registers without OS interrupt intervention.',
      },
    };
  }

  // PAGE FAULT OCCURS
  const newFaults = state.pageFaults + 1;

  // Check if there is an empty frame
  const emptyFrame = frames.find((f) => f.vpn === null);

  if (emptyFrame) {
    // Fill empty frame
    const frameId = emptyFrame.frameId;
    emptyFrame.vpn = targetVpn;
    emptyFrame.loadOrder = newRequestsCount;

    entry.pfn = frameId;
    entry.valid = true;

    fifoQueue.push(frameId);

    return {
      state: {
        ...state,
        pageTable,
        frames,
        fifoQueue,
        lastRequestedPage: targetVpn,
        lastResult: 'FAULT',
        evictedPage: null,
        evictedFrame: null,
        totalRequests: newRequestsCount,
        pageFaults: newFaults,
        currentRefIndex: state.currentRefIndex + 1,
      },
      action: `Page Fault (Loaded into Frame ${frameId})`,
      explanation: {
        what: `Page Fault on Page ${targetVpn}! Loaded from disk into free Physical Frame ${frameId}.`,
        why: 'Valid bit was 0. The OS intercepted the fault, fetched the page from storage, and updated the Page Table.',
        changed: `Physical Frame ${frameId} now holds Page ${targetVpn}. Page Table entry ${targetVpn} Valid bit set to 1.`,
        learned: 'Demand paging loads pages into memory on demand rather than loading the entire program at startup.',
      },
    };
  }

  // No empty frame: FIFO Page Replacement
  const victimFrameId = fifoQueue.shift(); // First In, First Out
  const victimFrame = frames.find((f) => f.frameId === victimFrameId);
  const oldVpn = victimFrame.vpn;

  // Invalidate old page table entry
  pageTable[oldVpn].valid = false;
  pageTable[oldVpn].pfn = null;

  // Assign frame to new page
  victimFrame.vpn = targetVpn;
  victimFrame.loadOrder = newRequestsCount;

  entry.pfn = victimFrameId;
  entry.valid = true;

  fifoQueue.push(victimFrameId);

  return {
    state: {
      ...state,
      pageTable,
      frames,
      fifoQueue,
      lastRequestedPage: targetVpn,
      lastResult: 'FAULT',
      evictedPage: oldVpn,
      evictedFrame: victimFrameId,
      totalRequests: newRequestsCount,
      pageFaults: newFaults,
      currentRefIndex: state.currentRefIndex + 1,
    },
    action: `FIFO Eviction: Page ${oldVpn} -> Page ${targetVpn}`,
    explanation: {
      what: `Page Fault with Eviction! All ${TOTAL_PHYSICAL_FRAMES} frames were full. Evicted Page ${oldVpn} from Frame ${victimFrameId} and loaded Page ${targetVpn}.`,
      why: 'Under FIFO replacement, the page that arrived earliest in physical RAM is selected for eviction.',
      changed: `Page ${oldVpn} invalidated in Page Table; Frame ${victimFrameId} now contains Page ${targetVpn}.`,
      learned: 'When RAM is saturated, replacement algorithms choose victims to balance swap I/O and process throughput.',
    },
  };
}

export function getNextVirtualMemoryStep(currentSnapshot) {
  const { state } = currentSnapshot;
  const refIndex = state.currentRefIndex % state.referenceString.length;
  const pageToRequest = state.referenceString[refIndex];
  return requestPage(currentSnapshot, pageToRequest);
}
