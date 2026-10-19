import React from 'react';
import { Shield, ShieldCheck, ShieldX, User, FileText, CheckCircle2, XCircle } from 'lucide-react';
import {
  SIMULATED_USERS,
  runAccessTest,
  togglePermissionBit,
  permissionsToOctal,
  permissionsToString,
} from '../../../simulations/filePermissionsEngine';
import './FilePermissionsSim.css';

export function FilePermissionsSim({ currentSnapshot, onPushSnapshot }) {
  const { state } = currentSnapshot;
  const { files, selectedFileId, selectedUserId, selectedAction, evalResult } = state;

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];
  const currentUser = SIMULATED_USERS.find((u) => u.id === selectedUserId) || SIMULATED_USERS[0];

  const handleSelectFile = (fileId) => {
    const snap = runAccessTest(currentSnapshot, selectedUserId, fileId, selectedAction);
    onPushSnapshot(snap);
  };

  const handleSelectUser = (userId) => {
    const snap = runAccessTest(currentSnapshot, userId, selectedFileId, selectedAction);
    onPushSnapshot(snap);
  };

  const handleSelectAction = (action) => {
    const snap = runAccessTest(currentSnapshot, selectedUserId, selectedFileId, action);
    onPushSnapshot(snap);
  };

  const handleToggleBit = (tier, bit) => {
    const snap = togglePermissionBit(currentSnapshot, selectedFileId, tier, bit);
    onPushSnapshot(snap);
  };

  const octal = permissionsToOctal(currentFile.permissions);
  const symbolic = permissionsToString(currentFile.permissions);

  return (
    <div className="file-permissions-sim" data-component="file-permissions-sim">
      {/* Target Selector Toolbar: File & User Selector */}
      <div className="perm-selectors-bar card-base">
        {/* File Select */}
        <div className="selector-group">
          <span className="selector-label">Target Virtual File:</span>
          <div className="selector-pills">
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                className={`btn-selector-pill ${file.id === selectedFileId ? 'active' : ''}`}
                onClick={() => handleSelectFile(file.id)}
              >
                <FileText size={14} />
                <span>{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Select */}
        <div className="selector-group">
          <span className="selector-label">Simulated Requesting User:</span>
          <div className="selector-pills">
            {SIMULATED_USERS.map((usr) => (
              <button
                key={usr.id}
                type="button"
                className={`btn-selector-pill ${usr.id === selectedUserId ? 'active' : ''}`}
                onClick={() => handleSelectUser(usr.id)}
              >
                <User size={14} />
                <span>{usr.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Access Decision Banner */}
      <div
        className={`access-decision-banner ${evalResult.allowed ? 'decision-allowed' : 'decision-denied'}`}
        data-component="access-decision"
      >
        <div className="decision-icon-wrapper">
          {evalResult.allowed ? (
            <ShieldCheck size={28} className="icon-grant" />
          ) : (
            <ShieldX size={28} className="icon-deny" />
          )}
        </div>
        <div className="decision-info">
          <div className="decision-title-row">
            <h3 className="decision-title">
              {evalResult.allowed ? 'ACCESS GRANTED' : 'PERMISSION DENIED'}
            </h3>
            <span className="decision-tier-badge">Evaluated via: {evalResult.decisionTier}</span>
          </div>
          <p className="decision-desc">{evalResult.ruleExplanation}</p>
        </div>
      </div>

      {/* Two Column Layout: Interactive Permission Matrix (chmod) & Test Request Bar */}
      <div className="permissions-matrix-split">
        {/* Interactive Matrix (chmod) */}
        <div className="permissions-matrix-card card-base" data-component="permission-panel">
          <div className="matrix-header">
            <div>
              <h4 className="matrix-title">POSIX Permission Matrix (chmod)</h4>
              <span className="matrix-sub">
                Click bits to modify permissions on "{currentFile.name}"
              </span>
            </div>
            <div className="octal-display-pill font-mono">
              <span className="octal-code">chmod {octal}</span>
              <span className="symbolic-code">{symbolic}</span>
            </div>
          </div>

          <table className="perm-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Identity</th>
                <th>Read (r=4)</th>
                <th>Write (w=2)</th>
                <th>Execute (x=1)</th>
              </tr>
            </thead>
            <tbody>
              {/* Owner */}
              <tr>
                <td><strong>Owner (u)</strong></td>
                <td><span className="id-chip">{currentFile.owner}</span></td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.owner.r ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('owner', 'r')}
                  >
                    r
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.owner.w ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('owner', 'w')}
                  >
                    w
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.owner.x ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('owner', 'x')}
                  >
                    x
                  </button>
                </td>
              </tr>

              {/* Group */}
              <tr>
                <td><strong>Group (g)</strong></td>
                <td><span className="id-chip">{currentFile.group}</span></td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.group.r ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('group', 'r')}
                  >
                    r
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.group.w ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('group', 'w')}
                  >
                    w
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.group.x ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('group', 'x')}
                  >
                    x
                  </button>
                </td>
              </tr>

              {/* Others */}
              <tr>
                <td><strong>Others (o)</strong></td>
                <td><span className="id-chip">World</span></td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.others.r ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('others', 'r')}
                  >
                    r
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.others.w ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('others', 'w')}
                  >
                    w
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className={`perm-bit-btn ${currentFile.permissions.others.x ? 'bit-on' : 'bit-off'}`}
                    onClick={() => handleToggleBit('others', 'x')}
                  >
                    x
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action System Call Simulator */}
        <div className="syscall-test-card card-base">
          <h4 className="syscall-title">Simulate System Call Access</h4>
          <p className="syscall-desc">
            Select an action to trigger discretionary access control evaluation:
          </p>

          <div className="syscall-actions-list">
            <button
              type="button"
              className={`btn-syscall ${selectedAction === 'r' ? 'active' : ''}`}
              onClick={() => handleSelectAction('r')}
            >
              <div className="syscall-text-wrap">
                <strong>read() System Call</strong>
                <span>Inspect file contents or view buffer</span>
              </div>
              <span className="action-bit-pill">Mode: r</span>
            </button>

            <button
              type="button"
              className={`btn-syscall ${selectedAction === 'w' ? 'active' : ''}`}
              onClick={() => handleSelectAction('w')}
            >
              <div className="syscall-text-wrap">
                <strong>write() System Call</strong>
                <span>Modify, append, or truncate file data</span>
              </div>
              <span className="action-bit-pill">Mode: w</span>
            </button>

            <button
              type="button"
              className={`btn-syscall ${selectedAction === 'x' ? 'active' : ''}`}
              onClick={() => handleSelectAction('x')}
            >
              <div className="syscall-text-wrap">
                <strong>execve() System Call</strong>
                <span>Launch binary or execute script</span>
              </div>
              <span className="action-bit-pill">Mode: x</span>
            </button>
          </div>

          <div className="dac-rule-summary-box">
            <strong>POSIX Discretionary Access Control (DAC) Rule:</strong>
            <p>
              The system checks the most specific tier first: If user == owner, only owner bits are checked. Group and Other bits are ignored completely!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
