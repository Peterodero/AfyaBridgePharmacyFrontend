import { useState, useEffect } from 'react';
import {
  RiAlertLine, RiAddLine, RiSearchLine, RiFilterLine,
  RiEditLine, RiDeleteBinLine, RiArrowUpLine, RiFileListLine,
  RiShieldLine, RiDownloadLine, RiCloseLine, RiSaveLine, RiRefreshLine,
} from "react-icons/ri";
import { useApi, useApiAction } from '../../hooks/useApi';
import { getDrugs, getInvDashboard, getLowStock, getExpiring, updateDrug, deleteDrug, createDrug, restockDrug } from '../../services/api';

const CATEGORIES = [
  { value:"", label:"All Categories" },
  { value:"analgesic", label:"Analgesics" },
  { value:"antibiotic", label:"Antibiotics" },
  { value:"antifungal", label:"Antifungals" },
  { value:"cardiovascular", label:"Cardiovascular" },
  { value:"chronic", label:"Chronic / Anti-Diabetic" },
  { value:"respiratory", label:"Respiratory" },
  { value:"vitamin", label:"Vitamins & Supplements" },
  { value:"other", label:"Other" },
];

const DOSAGE_FORMS = ["tablet","capsule","syrup","injection","cream","drops","inhaler","other"];

// ── Moved OUTSIDE Inventory so React never unmounts/remounts on re-render ──────

function Modal({ title, onClose, children }) {
  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header">
          <h3>{title}</h3>
          <button className="ab-modal-close" onClick={onClose}><RiCloseLine size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DrugForm({ formData, setFormData, onSubmit, onClose, isEdit, updating, creating }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="ab-modal-body">
        <div className="ab-form-row">
          <div className="ab-form-group">
            <label>Drug Name *</label>
            <input
              type="text"
              required
              value={formData.drug_name}
              onChange={e => setFormData(prev => ({ ...prev, drug_name: e.target.value }))}
              placeholder="e.g. Amoxicillin 500mg"
            />
          </div>
          <div className="ab-form-group">
            <label>Category *</label>
            <select
              required
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Select category</option>
              {CATEGORIES.slice(1).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="ab-form-row">
          <div className="ab-form-group">
            <label>Qty in Stock *</label>
            <input
              type="number"
              min="0"
              required
              value={formData.quantity_in_stock}
              onChange={e => setFormData(prev => ({ ...prev, quantity_in_stock: e.target.value }))}
              placeholder="e.g. 100"
            />
          </div>
          <div className="ab-form-group">
            <label>Reorder Level *</label>
            <input
              type="number"
              min="0"
              required
              value={formData.reorder_level}
              onChange={e => setFormData(prev => ({ ...prev, reorder_level: e.target.value }))}
              placeholder="e.g. 20"
            />
          </div>
        </div>
        <div className="ab-form-row">
          <div className="ab-form-group">
            <label>Dosage Form</label>
            <select
              value={formData.dosage_form}
              onChange={e => setFormData(prev => ({ ...prev, dosage_form: e.target.value }))}
            >
              {DOSAGE_FORMS.map(f => (
                <option key={f} value={f} style={{ textTransform:"capitalize" }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="ab-form-group">
            <label>Unit Price (KES) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.unit_price}
              onChange={e => setFormData(prev => ({ ...prev, unit_price: e.target.value }))}
              placeholder="e.g. 45.00"
            />
          </div>
        </div>
      </div>
      <div className="ab-modal-footer">
        <button type="button" className="ab-btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="ab-btn-primary" disabled={isEdit ? updating : creating}>
          <RiSaveLine size={14}/>{" "}
          {isEdit ? (updating ? "Updating…" : "Update Drug") : (creating ? "Adding…" : "Add Drug")}
        </button>
      </div>
    </form>
  );
}

function RestockForm({ restockData, setRestockData, onSubmit, onClose, editingDrug, restocking }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="ab-modal-body">
        <div style={{ background:"var(--ab-slate-50)", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:"var(--ab-slate-600)" }}>
          Current stock: <strong>{editingDrug.quantity_in_stock}</strong> units · Reorder at: <strong>{editingDrug.reorder_level}</strong>
        </div>
        <div className="ab-form-row">
          <div className="ab-form-group">
            <label>Quantity to Add *</label>
            <input
              type="number"
              min="1"
              required
              value={restockData.quantity}
              onChange={e => setRestockData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="e.g. 100"
            />
          </div>
          <div className="ab-form-group">
            <label>Batch Number *</label>
            <input
              type="text"
              required
              value={restockData.batch_no}
              onChange={e => setRestockData(prev => ({ ...prev, batch_no: e.target.value }))}
              placeholder="e.g. BATCH-2026-001"
            />
          </div>
        </div>
        <div className="ab-form-group">
          <label>Expiry Date *</label>
          <input
            type="date"
            required
            value={restockData.expiry_date}
            onChange={e => setRestockData(prev => ({ ...prev, expiry_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="ab-modal-footer">
        <button type="button" className="ab-btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="ab-btn-primary" disabled={restocking} style={{ background:"#059669" }}>
          <RiArrowUpLine size={14}/> {restocking ? "Restocking…" : "Confirm Restock"}
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Inventory() {
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [showFilters,      setShowFilters]       = useState(false);
  const [showAddModal,     setShowAddModal]      = useState(false);
  const [showEditModal,    setShowEditModal]     = useState(false);
  const [showRestockModal, setShowRestockModal]  = useState(false);
  const [editingDrug,      setEditingDrug]       = useState(null);

  const emptyForm    = { drug_name:'', category:'', quantity_in_stock:'', reorder_level:'', dosage_form:'tablet', unit_price:'' };
  const emptyRestock = { quantity:'', batch_no:'', expiry_date:'' };

  const [formData,    setFormData]    = useState(emptyForm);
  const [restockData, setRestockData] = useState(emptyRestock);

  const { data: inventoryResponse, loading: tableLoading, error: tableError, refetch } = useApi(
    getDrugs,
    { q: searchQuery||undefined, category: selectedCategory||undefined, page: currentPage },
    [searchQuery, selectedCategory, currentPage]
  );
  const { data: dashboardData, loading: statsLoading, refetch: refetchDash } = useApi(getInvDashboard, null, [], { silent: true });
  const { data: lowStockData  } = useApi(getLowStock, null, [], { silent: true });
  const { data: expiringData  } = useApi(() => getExpiring(30), null, [], { silent: true });

  const { execute: deleteDrugAction, loading: deleting   } = useApiAction(deleteDrug);
  const { execute: updateDrugAction, loading: updating   } = useApiAction(updateDrug);
  const { execute: createDrugAction, loading: creating   } = useApiAction(createDrug);
  const { execute: restockAction,    loading: restocking } = useApiAction(restockDrug);

  useEffect(() => {
    const t = setTimeout(() => setCurrentPage(1), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowRestockModal(false);
    setEditingDrug(null);
    setFormData(emptyForm);
    setRestockData(emptyRestock);
  };

  const handleDelete = async (drug) => {
    if (!window.confirm(`Delete "${drug.drug_name}"?`)) return;
    try { await deleteDrugAction(drug.id); refetch(); refetchDash(); }
    catch(e) { alert('Failed to delete: ' + (e.message || 'Unknown error')); }
  };

  const handleEdit = (drug) => {
    setFormData({
      drug_name:        drug.drug_name        || '',
      category:         drug.category         || '',
      quantity_in_stock:drug.quantity_in_stock || '',
      reorder_level:    drug.reorder_level     || '',
      dosage_form:      drug.unit || drug.dosage_form || 'tablet',
      unit_price:       drug.unit_price        || '',
    });
    setEditingDrug(drug);
    setShowEditModal(true);
  };

  const handleRestock = (drug) => {
    setEditingDrug(drug);
    setRestockData(emptyRestock);
    setShowRestockModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      drug_name:         formData.drug_name,
      category:          formData.category,
      quantity_in_stock: parseInt(formData.quantity_in_stock)  || 0,
      reorder_level:     parseInt(formData.reorder_level)      || 10,
      unit:              formData.dosage_form,
      unit_price:        parseFloat(formData.unit_price)       || 0,
    };
    try {
      if (editingDrug) { await updateDrugAction(editingDrug.id, data); }
      else             { await createDrugAction(data); }
      closeModals(); refetch(); refetchDash();
    } catch(e) { alert(`Failed: ${e.message}`); }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockData.quantity || !restockData.batch_no || !restockData.expiry_date) {
      alert('All restock fields are required.');
      return;
    }
    try {
      await restockAction(editingDrug.id, {
        quantity:    parseInt(restockData.quantity),
        batch_no:    restockData.batch_no,
        expiry_date: restockData.expiry_date,
      });
      alert(`Stock updated! Added ${restockData.quantity} units of ${editingDrug.drug_name}.`);
      closeModals(); refetch(); refetchDash();
    } catch(e) { alert(`Restock failed: ${e.message}`); }
  };

  const dashboard  = dashboardData || {};
  const medicines  = inventoryResponse?.results || (Array.isArray(inventoryResponse) ? inventoryResponse : []);
  const pagination = inventoryResponse?.pagination || {};
  const totalPages = pagination.total_pages || Math.ceil((inventoryResponse?.count || 0) / 20) || 1;
  const lowStockArr = Array.isArray(lowStockData) ? lowStockData : lowStockData?.results ?? [];
  const expiringArr = Array.isArray(expiringData) ? expiringData : expiringData?.results ?? [];
  const totalMeds  = dashboard.total_skus      || inventoryResponse?.count || 0;
  const lowCount   = dashboard.low_stock_count || lowStockArr.length       || 0;
  const expCount   = dashboard.expiring_count  || expiringArr.length       || 0;

  return (
    <>
      {/* Alert banner */}
      {(lowCount > 0 || expCount > 0) && (
        <div className="ab-alert">
          <div className="ab-alert-body">
            <div className="ab-alert-icon"><RiAlertLine size={16} color="#dc2626"/></div>
            <div>
              <div className="ab-alert-title">Immediate attention required</div>
              <div className="ab-alert-desc">{expCount} items expiring soon and {lowCount} are critically low in stock.</div>
            </div>
          </div>
          <button className="ab-btn-danger" onClick={() => { setSelectedCategory(''); setSearchQuery(''); }}>View All Issues</button>
        </div>
      )}

      {/* Stats */}
      <div className="ab-inv-stats">
        <div className="ab-inv-stat">
          <div className="ab-inv-stat-label">Total Medicines</div>
          <div className="ab-inv-stat-row">
            <div className="ab-inv-stat-val">{statsLoading ? '…' : totalMeds.toLocaleString()}</div>
            <span className="ab-badge green"><RiArrowUpLine size={12}/> Active</span>
          </div>
        </div>
        <div className={`ab-inv-stat ${lowCount > 0 ? "danger" : ""}`}>
          <div className="ab-inv-stat-label">Low Stock Items</div>
          <div className="ab-inv-stat-row">
            <div className="ab-inv-stat-val red">{lowCount}</div>
            <span className="ab-badge red">High Priority</span>
          </div>
        </div>
        <div className="ab-inv-stat">
          <div className="ab-inv-stat-label">Expiring (30 Days)</div>
          <div className="ab-inv-stat-row">
            <div className="ab-inv-stat-val amber">{expCount}</div>
            <span className="ab-badge amber">Review Soon</span>
          </div>
        </div>
        <div className="ab-inv-stat">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div className="ab-pending-icon"><RiFileListLine size={20} color="#1152d4"/></div>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>Critical Count</div>
              <div style={{ fontSize:12, color:"var(--ab-slate-500)" }}>{dashboard.critical_count || 0} critically low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ab-card">
        <div className="ab-action-bar">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div className="ab-search-field">
              <RiSearchLine className="ab-search-field-icon" size={14}/>
              <input
                placeholder="Search inventory…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="ab-btn-secondary" style={{ padding:"8px 10px" }} onClick={() => setShowFilters(!showFilters)}>
              <RiFilterLine size={16}/>
            </button>
            <button className="ab-btn-secondary" style={{ padding:"8px 10px" }} onClick={() => { refetch(); refetchDash(); }}>
              <RiRefreshLine size={16}/>
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <select className="ab-select" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button className="ab-btn-primary" onClick={() => { setFormData(emptyForm); setEditingDrug(null); setShowAddModal(true); }}>
              <RiAddLine size={13}/> Add Drug
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="ab-filters-section">
            <div className="ab-filter-row">
              <div className="ab-filter-group">
                <label>Category</label>
                <select className="ab-select" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="ab-filter-actions">
              <button className="ab-btn-link" onClick={() => { setSelectedCategory(''); setSearchQuery(''); setCurrentPage(1); }}>Clear All</button>
              <button className="ab-btn-secondary" onClick={() => setShowFilters(false)}>Done</button>
            </div>
          </div>
        )}

        {tableError && (
          <div style={{ padding:"12px 20px", background:"#fef2f2", color:"#dc2626", fontSize:13 }}>⚠️ {tableError}</div>
        )}

        <table className="ab-table">
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>Category</th>
              <th>Dosage Form</th>
              <th>Stock Qty</th>
              <th>Reorder At</th>
              <th>Unit Price</th>
              <th style={{ textAlign:"right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              Array.from({length:6}).map((_,i) => (
                <tr key={i}>{Array.from({length:7}).map((_,j) => (
                  <td key={j}><div style={{height:14,background:"#f3f4f6",borderRadius:4}}/></td>
                ))}</tr>
              ))
            ) : medicines.length === 0 ? (
              <tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#9ca3af"}}>No medicines found.</td></tr>
            ) : medicines.map((drug) => {
              const isLow      = drug.quantity_in_stock <= drug.reorder_level;
              const isCritical = drug.quantity_in_stock <= (drug.critical_level || 5);
              return (
                <tr key={drug.id} className={isCritical ? "low-stock" : ""}>
                  <td>
                    <div className="ab-med-cell">
                      <div className={`ab-med-icon ${isCritical ? "red" : "green"}`}><RiShieldLine size={14}/></div>
                      <div className="ab-med-name">{drug.drug_name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="ab-cat-badge">
                      {drug.category ? drug.category.charAt(0).toUpperCase() + drug.category.slice(1) : "—"}
                    </span>
                  </td>
                  <td style={{ color:"var(--ab-slate-500)", fontSize:13, textTransform:"capitalize" }}>
                    {drug.unit || drug.dosage_form || "—"}
                  </td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span className={`ab-stock ${isLow ? "low" : ""}`}>{drug.quantity_in_stock}</span>
                      {isLow && <span style={{ color:"var(--ab-red)", fontWeight:700, fontSize:16 }}>!</span>}
                    </div>
                  </td>
                  <td style={{ color:"var(--ab-slate-500)" }}>{drug.reorder_level}</td>
                  <td style={{ fontWeight:600, color:"var(--ab-slate-800)" }}>
                    KES {Number(drug.unit_price || 0).toLocaleString("en-KE", { minimumFractionDigits:2 })}
                  </td>
                  <td>
                    <div className="ab-action-col">
                      <button className="ab-icon-action" title="Restock" onClick={() => handleRestock(drug)} style={{ color:"#059669" }}>
                        <RiArrowUpLine size={15}/>
                      </button>
                      <button className="ab-icon-action" title="Edit" onClick={() => handleEdit(drug)} disabled={updating}>
                        <RiEditLine size={15}/>
                      </button>
                      <button className="ab-icon-action del" title="Delete" onClick={() => handleDelete(drug)} disabled={deleting}>
                        <RiDeleteBinLine size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="ab-pagination">
            <div className="ab-page-info">Page {currentPage} of {totalPages}</div>
            <div className="ab-page-btns">
              <button className="ab-page-btn" disabled={currentPage===1} onClick={() => setCurrentPage(p => p-1)}>Previous</button>
              {Array.from({length: Math.min(5, totalPages)}, (_,i) => i+1).map(n => (
                <button key={n} className={`ab-page-btn ${currentPage===n ? "active" : ""}`} onClick={() => setCurrentPage(n)}>{n}</button>
              ))}
              <button className="ab-page-btn" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p => p+1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add New Drug" onClose={closeModals}>
          <DrugForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModals}
            isEdit={false}
            updating={updating}
            creating={creating}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title="Edit Drug" onClose={closeModals}>
          <DrugForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={closeModals}
            isEdit={true}
            updating={updating}
            creating={creating}
          />
        </Modal>
      )}

      {/* Restock Modal */}
      {showRestockModal && editingDrug && (
        <Modal title={`Restock — ${editingDrug.drug_name}`} onClose={closeModals}>
          <RestockForm
            restockData={restockData}
            setRestockData={setRestockData}
            onSubmit={handleRestockSubmit}
            onClose={closeModals}
            editingDrug={editingDrug}
            restocking={restocking}
          />
        </Modal>
      )}
    </>
  );
}