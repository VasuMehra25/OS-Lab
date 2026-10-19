import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  HardDrive,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  createNode,
  deleteNode,
  renameNode,
  TOTAL_DISK_CAPACITY_KB,
  TOTAL_INODES,
} from '../../../simulations/fileSystemEngine';
import './FileSystemSim.css';

export function FileSystemSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const { tree, selectedNodeId, expandedFolderIds, usedSizeKb, freeSizeKb, usedInodes, totalInodes } = state;

  const [expanded, setExpanded] = useState(new Set(expandedFolderIds || ['root', 'bin', 'etc', 'home', 'user']));
  const [selectedId, setSelectedId] = useState(selectedNodeId || 'root');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('file');
  const [newItemSize, setNewItemSize] = useState(32);
  const [renameValue, setRenameValue] = useState('');

  const toggleExpand = (folderId, e) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Find selected node in tree
  function findNode(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const c of node.children) {
        const found = findNode(c, id);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedNode = findNode(tree, selectedId) || tree;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const parentId = selectedNode.type === 'dir' ? selectedNode.id : 'root';
    const snap = createNode(currentSnapshot, parentId, newItemName.trim(), newItemType, newItemSize);
    onPushSnapshot(snap);
    setNewItemName('');
    setShowCreateModal(false);
    // expand parent
    setExpanded((prev) => new Set([...prev, parentId]));
  };

  const handleDelete = () => {
    if (selectedId === 'root') return;
    const snap = deleteNode(currentSnapshot, selectedId);
    onPushSnapshot(snap);
    setSelectedId('root');
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (!renameValue.trim() || selectedId === 'root') return;
    const snap = renameNode(currentSnapshot, selectedId, renameValue.trim());
    onPushSnapshot(snap);
    setShowRenameModal(false);
    setRenameValue('');
  };

  // Render tree recursively
  const renderTree = (node, depth = 0) => {
    const isDir = node.type === 'dir';
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div
          className={`tree-row ${isSelected ? 'row-selected' : ''}`}
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
          onClick={() => setSelectedId(node.id)}
          role="treeitem"
          aria-selected={isSelected}
        >
          {isDir ? (
            <button
              type="button"
              className="tree-expand-btn"
              onClick={(e) => toggleExpand(node.id, e)}
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-leaf-spacer" />
          )}

          <div className="tree-icon-wrapper">
            {isDir ? (
              isExpanded ? (
                <FolderOpen size={16} className="icon-folder-open" />
              ) : (
                <Folder size={16} className="icon-folder" />
              )
            ) : node.ext === 'c' || node.ext === 'bin' ? (
              <FileCode size={15} className="icon-file-code" />
            ) : (
              <FileText size={15} className="icon-file-text" />
            )}
          </div>

          <span className="tree-node-name">{node.name}</span>
          <span className="tree-node-size font-mono">{node.sizeKb} KB</span>
        </div>

        {isDir && isExpanded && node.children && (
          <div className="tree-children-container" role="group">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-system-sim" data-component="file-system-sim">
      {/* Storage Disk Status Banner */}
      <div className="storage-status-strip card-base" data-component="storage-status">
        <div className="storage-stat-item">
          <span className="storage-stat-label">Virtual Disk Space</span>
          <span className="storage-stat-val">
            <strong>{usedSizeKb}</strong> / {TOTAL_DISK_CAPACITY_KB} KB
          </span>
          <div className="storage-mini-bar">
            <div
              className="storage-mini-fill"
              style={{ width: `${Math.round((usedSizeKb / TOTAL_DISK_CAPACITY_KB) * 100)}%` }}
            />
          </div>
        </div>

        <div className="storage-stat-item">
          <span className="storage-stat-label">Inode Bitmap Allocation</span>
          <span className="storage-stat-val">
            <strong>{usedInodes}</strong> / {TOTAL_INODES} Inodes
          </span>
          <span className="storage-sub">{TOTAL_INODES - usedInodes} Inodes Free</span>
        </div>

        <div className="storage-stat-item">
          <span className="storage-stat-label">File System Type</span>
          <span className="storage-stat-val font-mono">ext4 (virtual)</span>
          <span className="storage-sub">Block size: 4 KB</span>
        </div>
      </div>

      {/* Main Split: Folder Tree View & Node Metadata Inspector */}
      <div className="fs-split-container">
        {/* Left: Tree View & Toolbar */}
        <div className="fs-tree-panel card-base" data-component="file-tree">
          <div className="fs-tree-header">
            <div className="tree-header-left">
              <HardDrive size={16} className="fs-icon" />
              <h4 className="fs-tree-title">Hierarchical Directory Tree</h4>
            </div>

            {/* Quick Actions */}
            <div className="tree-actions-group">
              <button
                type="button"
                className="btn-tree-action btn-add"
                onClick={() => setShowCreateModal(true)}
                title="Create file or folder inside current selection"
              >
                <Plus size={14} />
                <span>New</span>
              </button>
              {selectedId !== 'root' && (
                <>
                  <button
                    type="button"
                    className="btn-tree-action btn-rename"
                    onClick={() => {
                      setRenameValue(selectedNode.name);
                      setShowRenameModal(true);
                    }}
                    title="Rename selected node"
                  >
                    <Edit2 size={13} />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    className="btn-tree-action btn-delete"
                    onClick={handleDelete}
                    title="Delete selected node"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tree Structure */}
          <div className="fs-tree-body" role="tree" aria-label="Virtual Folder Structure">
            {renderTree(tree, 0)}
          </div>
        </div>

        {/* Right: Inode & Metadata Inspector */}
        <div className="fs-inspector-panel card-base" data-component="node-inspector">
          <div className="inspector-header">
            <h4 className="inspector-title">Inode Metadata Record</h4>
            <span className="inode-badge">Inode #{selectedNode.inode}</span>
          </div>

          <div className="inspector-details-list">
            <div className="detail-row">
              <span className="detail-key">Object Name</span>
              <strong className="detail-val">{selectedNode.name}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-key">Object Type</span>
              <span className="detail-val type-pill">{selectedNode.type.toUpperCase()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Size on Storage</span>
              <span className="detail-val font-mono">{selectedNode.sizeKb} KB</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Allocated Inode</span>
              <span className="detail-val font-mono">#{selectedNode.inode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Direct Block Pointers</span>
              <span className="detail-val font-mono">
                [Blocks {selectedNode.inode * 4}–{selectedNode.inode * 4 + Math.ceil(selectedNode.sizeKb / 4) - 1}]
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-key">Modification Time</span>
              <span className="detail-val">{selectedNode.modified || 'Recent'}</span>
            </div>
          </div>

          <div className="inspector-note-box">
            <p>
              In UNIX-like file systems, file data is not stored in directory entries. The directory simply maps the filename to an <strong>inode number</strong>. The inode stores file size, owner permissions, and pointers to raw storage blocks.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal / Popover */}
      {showCreateModal && (
        <div className="fs-modal-backdrop">
          <div className="fs-modal-card card-base">
            <h4 className="modal-title">Create Inode in "{selectedNode.name}"</h4>
            <form onSubmit={handleCreate} className="fs-modal-form">
              <div className="form-field">
                <label>Item Type</label>
                <div className="type-toggle-row">
                  <button
                    type="button"
                    className={`btn-toggle-type ${newItemType === 'file' ? 'active' : ''}`}
                    onClick={() => setNewItemType('file')}
                  >
                    File
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle-type ${newItemType === 'dir' ? 'active' : ''}`}
                    onClick={() => setNewItemType('dir')}
                  >
                    Directory (Folder)
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="item-name-input">Name</label>
                <input
                  id="item-name-input"
                  type="text"
                  placeholder={newItemType === 'file' ? 'e.g. data_pipeline.py' : 'e.g. analytics'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              {newItemType === 'file' && (
                <div className="form-field">
                  <label htmlFor="item-size-input">File Size (KB)</label>
                  <input
                    id="item-size-input"
                    type="number"
                    min="1"
                    max="1024"
                    value={newItemSize}
                    onChange={(e) => setNewItemSize(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              )}

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fs-modal-backdrop">
          <div className="fs-modal-card card-base">
            <h4 className="modal-title">Rename "{selectedNode.name}"</h4>
            <form onSubmit={handleRename} className="fs-modal-form">
              <div className="form-field">
                <label htmlFor="rename-input">New Name</label>
                <input
                  id="rename-input"
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setShowRenameModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
