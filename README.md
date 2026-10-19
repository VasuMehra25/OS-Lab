# OS Inside — Interactive OS Learning Visualizer

> **"Explore the computer within. Learn operating systems by watching them work."**

A complete, functional React application designed to teach Operating System fundamentals through interactive, reversible, deterministic simulations. Built with a clean, modern pastel design system and engineered specifically for **Agentation** workflows.

---

## 🛠️ Tech Stack & Architecture

- **React 19** + **Vite 8**
- **JavaScript (ES Modules)**
- **CSS Design Tokens & Scoped Components** (using CSS custom properties / variables)
- **React Router 7** for seamless navigation
- **Lucide React** for clean, modern iconography
- **LocalStorage** for persistent concept mastery tracking

---

## 🚀 Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

Development server runs by default on `http://localhost:5173/`.

---

## 🎨 Agentation Compatibility Guide

The codebase is strictly structured for Agentation annotation and fine-grained visual customization:

1. **Stable Semantic Selectors**: Important UI components feature persistent `data-component` attributes:
   - `data-component="top-navigation"`
   - `data-component="computer-illustration"`
   - `data-component="topic-card"`
   - `data-component="concept-page-layout"`
   - `data-component="simulation-panel"`
   - `data-component="simulation-controls"`
   - `data-component="step-explanation"`
   - `data-component="knowledge-check"`
   - `data-component="ram-visualization"`
   - `data-component="gantt-chart"`
   - `data-component="page-table"`
   - `data-component="io-request-queue"`
   - `data-component="interrupt-timeline"`
   - `data-component="file-tree"`
   - `data-component="permission-panel"`
2. **Decoupled Architecture**: All simulation algorithms, mathematical metrics, and state transitions reside in `src/simulations/` completely separated from DOM elements and styling. You can safely modify component spacing, typography, colors, and layout without breaking any simulation logic.
3. **Dedicated CSS Files**: Styles are isolated in component-level CSS files with design variables in `src/styles/variables.css`.

---

## ⚡ Flagship Feature: Real-Time Process Movement & Swapping Simulator (`/simulator`)

The signature interactive feature of **OS Inside** is a live, deterministic computer simulation visualizing how processes move dynamically across four interconnected operating system subsystems:

1. **Secondary Storage (Disk / Swap Space)**:
   - Processes created or suspended await memory admission.
   - Separate swap space tracking swapped-out tasks with 1-click **"Swap In"** reloading.
2. **Physical RAM Grid**:
   - Visual memory address grid supporting **256 KB, 512 KB, 768 KB, and 1024 KB** physical capacities (32 KB per block).
   - Contiguous **First-Fit allocation**, partition occupancy indicators, and instant **"Swap Out to Disk"** controls.
   - Automatic detection of **External Fragmentation** and memory exhaustion warnings with one-click swap recommendations.
3. **Ready Queue**:
   - In-memory runnable buffer showing queue positions (`#1 Next`, `#2`, etc.) and allocated address ranges.
4. **CPU Core #0**:
   - Active running process with live execution progress gauges, remaining ticks counters, and automatic memory deallocation upon termination.

### Controls:
- **Create Process**: Custom name, memory size (32KB–192KB), and CPU burst time (1–10 ticks), plus quick presets.
- **Change RAM Capacity**: Dynamically test 8, 16, 24, or 32 block capacities and observe memory constraints.
- **Process State Inspector**: Click any process anywhere in the system to inspect its PCB, address range, burst time, and state.
- **Swapping vs. Paging Educational Comparison**: Explicitly distinguishes whole-process image swapping from demand paging.
- **Reversible Time Travel**: Full *Step Forward*, *Step Backward* (restores actual previous state), *Auto Play*, *Pause*, and *Reset*.

---

## 📚 Curriculum & The 8 Interactive Concept Simulations

### 1. Process Management
- **Process Lifecycle & State Transitions** (`/learn/process-lifecycle`):
  Step through the 5 classic process states (*New*, *Ready*, *Running*, *Waiting / Blocked*, and *Terminated*). Create processes dynamically, watch CPU dispatcher switches, and observe I/O wait yield operations.
- **CPU Scheduling Algorithms** (`/learn/cpu-scheduling`):
  Interactive simulation comparing **First-Come First-Served (FCFS)** and preemptive **Round Robin (RR)** with configurable time quantums. Features dynamic Gantt charts, editable arrival/burst times, and real-time calculation of Average Waiting Time and Turnaround Time.

### 2. Memory Management
- **RAM Allocation & Fragmentation** (`/learn/ram-allocation`):
  Visual 16-block RAM address grid (512 KB total). Implements First-Fit contiguous allocation, partition release, internal fragmentation metrics, and automatic detection of external fragmentation holes.
- **Virtual Memory & Demand Paging** (`/learn/virtual-memory`):
  Side-by-side visualization of 8 virtual pages and 4 physical RAM frames. Tracks the hardware Page Table (VPN → PFN mapping with Valid bits), reference access streams, Page Hits, Page Faults, and FIFO frame eviction.

### 3. Device Management
- **I/O Request Queue Management** (`/learn/io-queue`):
  Simulates single-channel hardware controllers (Laser Printer vs NVMe Disk). Enqueue custom I/O requests, observe device busy/idle states, and watch FIFO request buffering.
- **Interrupt Handling Cycle** (`/learn/interrupt-handling`):
  8-stage CPU interrupt pipeline (User App → Hardware IRQ assertion → Instruction boundary check → Stack save → IVT vector lookup → Kernel ISR execution → IRET restore → Resumption). Includes live CPU register file (PC, EAX, EBX, Flags) and kernel stack inspection.

### 4. Information Management
- **File System Explorer & Inode Tree** (`/learn/file-system`):
  Virtual hierarchical directory structure (`/`, `/bin`, `/etc`, `/home/student`). Create virtual files and folders, rename nodes, delete files, and inspect raw inode metadata and block allocation pointers.
- **File Permissions & Access Control** (`/learn/file-permissions`):
  POSIX Discretionary Access Control (DAC) simulator. Interactive `chmod` matrix (read/write/execute across Owner, Group, Others) with octal calculator (`755`, `640`, etc.), simulated users (`alice`, `bob`, `charlie`, `root`), and access evaluation flow.

---

## 🧠 Learning & Knowledge Checks

Each concept includes:
- Clear definition and "Why This Matters" real-world context
- Live 4-Pillar Inspector on every step (*What is happening? Why is it happening? What changed? What should the student learn?*)
- Full time-travel controls (*Previous Step*, *Next Step*, *Auto Play*, *Pause*, *Reset*)
- Interactive Knowledge Check question with immediate feedback
- LocalStorage persistence that updates the curriculum completion pill across the entire app
