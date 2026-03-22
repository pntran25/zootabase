import React, { useState, useEffect, useMemo } from 'react';
import '../AdminTable.css';
import { PawPrint, Search, Plus, Edit2, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, X, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { toast } from 'sonner';
import AdminModalForm from '../AdminModalForm';
import DatePickerInput from '../DatePickerInput';
import AdminSelect from '../AdminSelect';
import animalService from '../../../services/animalService';
import { getAllSpeciesCodes, getNextAnimalCode } from '../../../services/speciesCodeService';
import { API_BASE_URL } from '../../../services/apiClient';
import { getExhibits } from '../../../services/exhibitService';

const SortIcon = ({ column }) => {
  if (!column.getCanSort()) return null;
  return (
    <span className="sort-icon">
      {column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
       column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
       <ChevronsUpDown size={12} />}
    </span>
  );
};

const healthStyle = (health) => {
  switch (health) {
    case 'Excellent': return { bg: '#dcfce7', text: '#166534', dot: '#22c55e' };
    case 'Good':      return { bg: 'var(--adm-bg-surface-2)', text: 'var(--adm-text-secondary)', dot: '#94a3b8' };
    case 'Fair':
    case 'Needs Checkup': return { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' };
    case 'Critical':  return { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' };
    default:          return { bg: 'var(--adm-bg-surface-2)', text: 'var(--adm-text-secondary)', dot: '#94a3b8' };
  }
};

const DEPARTURE_OPTIONS = [
  { value: 'Deceased',    label: 'Deceased — animal has passed away' },
  { value: 'Transferred', label: 'Transferred — moved to another zoo' },
  { value: 'Released',    label: 'Released — returned to the wild' },
  { value: 'Other',       label: 'Other' },
];

const ManageAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [filterEndangered, setFilterEndangered] = useState(false);
  const [formData, setFormData] = useState({
    name: '', species: '', speciesDetail: '', exhibit: '', age: '', gender: 'Unknown',
    diet: '', health: 'Good', dateArrived: '', lifespan: '', weight: '', region: '', funFact: '',
    isEndangered: false, isDisplay: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exhibits, setExhibits] = useState([]);

  // Species code state
  const [speciesCodes, setSpeciesCodes] = useState([]);
  const [animalCodePreview, setAnimalCodePreview] = useState('');
  const [isNewSpecies, setIsNewSpecies] = useState(false);
  const [newCodeSuffix, setNewCodeSuffix] = useState('');

  // Lookup modal
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupSearch, setLookupSearch] = useState('');

  // Departure dialog
  const [departureTarget, setDepartureTarget] = useState(null);
  const [departureReason, setDepartureReason] = useState('Deceased');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [animalData, exhibitData] = await Promise.all([
        animalService.getAllAnimals(),
        getExhibits(),
      ]);
      setAnimals(animalData);
      setExhibits(exhibitData);
      // Species codes are non-fatal — table may not exist yet before server restart
      try {
        const codeData = await getAllSpeciesCodes();
        setSpeciesCodes(codeData);
      } catch {
        // silently ignore — codes will load after server restart runs migrations
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error(err.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const displayAnimals = useMemo(() =>
    animals.filter(a => a.isDisplay === true || a.isDisplay === 1).filter(animal => {
      const matchesSearch =
        animal.name.toLowerCase().includes(search.toLowerCase()) ||
        animal.species.toLowerCase().includes(search.toLowerCase()) ||
        (animal.animalCode || '').toLowerCase().includes(search.toLowerCase());
      const matchesEndangered = !filterEndangered ||
        animal.isEndangered === true || animal.isEndangered === 1;
      return matchesSearch && matchesEndangered;
    }), [animals, search, filterEndangered]);

  const groupedAnimals = useMemo(() => {
    const nonDisplay = animals.filter(a => !(a.isDisplay === true || a.isDisplay === 1));
    const filtered = nonDisplay.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.species.toLowerCase().includes(search.toLowerCase()) ||
      (a.animalCode || '').toLowerCase().includes(search.toLowerCase())
    );
    const groups = {};
    for (const animal of filtered) {
      const prefix = (animal.animalCode || '').split('-')[0] || 'other';
      if (!groups[prefix]) groups[prefix] = { prefix, species: animal.species, animals: [] };
      groups[prefix].animals.push(animal);
    }
    for (const g of Object.values(groups))
      g.animals.sort((a, b) => (a.animalCode || '').localeCompare(b.animalCode || ''));
    return Object.values(groups).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [animals, search]);

  const handleOpenModal = (animal = null) => {
    if (animal) {
      setEditingAnimal(animal);
      setFormData({
        name: animal.name || '', species: animal.species || '', speciesDetail: animal.speciesDetail || '',
        exhibit: animal.exhibit || '',
        age: animal.age || 0, gender: animal.gender || 'Unknown', diet: animal.diet || '',
        health: animal.health || 'Good',
        dateArrived: animal.dateArrived ? animal.dateArrived.split('T')[0] : '',
        lifespan: animal.lifespan || '', weight: animal.weight || '',
        region: animal.region || '', funFact: animal.funFact || '',
        isEndangered: animal.isEndangered === true || animal.isEndangered === 1,
        isDisplay: animal.isDisplay === true || animal.isDisplay === 1,
      });
      setAnimalCodePreview(animal.animalCode || '');
      setIsNewSpecies(false);
      setNewCodeSuffix('');
      setImageFile(null);
      setPreviewUrl(animal.imageUrl ? `${API_BASE_URL}${animal.imageUrl}` : null);
    } else {
      setEditingAnimal(null);
      setFormData({ name: '', species: '', speciesDetail: '', exhibit: '', age: '', gender: 'Unknown', diet: '', health: 'Good', dateArrived: '', lifespan: '', weight: '', region: '', funFact: '', isEndangered: false, isDisplay: false });
      setAnimalCodePreview('');
      setIsNewSpecies(false);
      setNewCodeSuffix('');
      setImageFile(null);
      setPreviewUrl(null);
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSpeciesChange = async (val) => {
    setFormData(prev => ({ ...prev, species: val }));
    if (editingAnimal) return; // don't change code when editing
    const match = speciesCodes.find(sc => sc.speciesName.toLowerCase() === val.toLowerCase());
    if (val && match) {
      setIsNewSpecies(false);
      const preview = await getNextAnimalCode(val);
      setAnimalCodePreview(preview ? preview.animalCode : '');
    } else if (val) {
      setIsNewSpecies(true);
      setAnimalCodePreview('');
      setNewCodeSuffix('');
    } else {
      setIsNewSpecies(false);
      setAnimalCodePreview('');
    }
  };

  const handleDelete = (animal) => {
    setDepartureTarget({ id: animal.id, name: animal.name });
    setDepartureReason('Deceased');
  };

  const handleSetDisplay = (animal) => {
    handleOpenModal(animal);
    setFormData(prev => ({ ...prev, isDisplay: true }));
    toast.info('Fill in the image and quick facts, then save to feature this animal on the public site.');
  };

  const handleUnsetDisplay = async (id) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;
    try {
      await animalService.updateAnimal(id, {
        name: animal.name, species: animal.species, speciesDetail: animal.speciesDetail,
        exhibit: animal.exhibit, age: animal.age, gender: animal.gender,
        diet: animal.diet, health: animal.health, dateArrived: animal.dateArrived,
        lifespan: animal.lifespan, weight: animal.weight, region: animal.region,
        funFact: animal.funFact, isEndangered: animal.isEndangered, isDisplay: false,
      });
      setAnimals(prev => prev.map(a => a.id === id ? { ...a, isDisplay: false } : a));
      toast.success('Removed from display.');
    } catch (err) {
      toast.error(err.message || 'Failed to update.');
    }
  };

  const confirmDeparture = async () => {
    try {
      await animalService.deleteAnimal(departureTarget.id, departureReason);
      setAnimals(prev => prev.filter(a => a.id !== departureTarget.id));
      toast.success(`${departureTarget.name} marked as ${departureReason.toLowerCase()}.`);
      setDepartureTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove animal.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAnimal && isNewSpecies && !newCodeSuffix) {
      toast.error('Enter a species code suffix for the new species (e.g. "lio" for Lion).');
      return;
    }
    try {
      const payload = {
        ...formData,
        isDisplay: formData.isDisplay,
        ...(!editingAnimal && isNewSpecies ? { codeSuffix: newCodeSuffix } : {}),
      };
      let savedAnimalId = null;
      if (editingAnimal) {
        await animalService.updateAnimal(editingAnimal.id, payload);
        savedAnimalId = editingAnimal.id;
      } else {
        const result = await animalService.createAnimal(payload);
        savedAnimalId = result.id;
      }
      await animalService.setEndangered(savedAnimalId, formData.isEndangered);
      if (imageFile && savedAnimalId) {
        await animalService.uploadAnimalImage(savedAnimalId, imageFile);
      }
      await loadData();
      setIsModalOpen(false);
      toast.success(editingAnimal ? 'Animal record updated.' : 'Animal added successfully.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save animal. Please check your inputs.');
    }
  };

  const columns = useMemo(() => [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const animal = row.original;
        return animal.imageUrl ? (
          <img src={`${API_BASE_URL}${animal.imageUrl}`} alt={animal.name}
            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', display: 'block' }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--adm-bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
            <ImageIcon size={18} style={{ color: 'var(--adm-text-muted)' }} />
          </div>
        );
      },
    },
    {
      accessorKey: 'animalCode',
      header: 'Animal ID',
      size: 120,
      cell: info => info.getValue()
        ? <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--adm-accent)', fontWeight: 700 }}>{info.getValue()}</span>
        : <span className="text-secondary">—</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: info => <span className="font-medium text-dark">{info.getValue()}</span>,
    },
    {
      accessorKey: 'species',
      header: 'Animal Group',
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span className="font-medium text-dark">{row.original.species}</span>
          {row.original.speciesDetail && (
            <span className="text-secondary" style={{ fontSize: '0.78rem' }}>{row.original.speciesDetail}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'exhibit',
      header: 'Exhibit',
      cell: info => info.getValue()
        ? <span className="pill-badge outline">{info.getValue()}</span>
        : <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Undecided</span>,
    },
    {
      id: 'dietAge',
      header: 'Diet / Age',
      enableSorting: false,
      cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.82rem' }}>
          <span className="text-secondary">Diet: <span className="font-medium text-dark">{row.original.diet || 'Unknown'}</span></span>
          <span className="text-secondary">Age: <span className="font-medium text-dark">{row.original.age} yrs</span> ({row.original.gender})</span>
        </div>
      ),
    },
    {
      accessorKey: 'health',
      header: 'Health',
      cell: info => {
        const s = healthStyle(info.getValue());
        return (
          <span className="pill-badge outline" style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}33` }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: s.dot, marginRight: 5 }} />
            {info.getValue()}
          </span>
        );
      },
    },
    {
      accessorKey: 'isEndangered',
      header: 'Endangered',
      sortingFn: (a, b) => {
        const aV = (a.original.isEndangered === true || a.original.isEndangered === 1) ? 1 : 0;
        const bV = (b.original.isEndangered === true || b.original.isEndangered === 1) ? 1 : 0;
        return aV - bV;
      },
      cell: info => {
        const isEndangered = info.getValue() === true || info.getValue() === 1;
        return isEndangered ? (
          <span className="endangered-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fef2f2', color: '#b91c1c',
            border: '1px solid #fca5a5', borderRadius: 20,
            padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700,
          }}>
            <AlertTriangle size={12} />
            Endangered
          </span>
        ) : null;
      },
    },
    {
      id: 'modifiedBy',
      header: 'Modified By',
      enableSorting: false,
      cell: ({ row }) => {
        const { createdBy, updatedBy } = row.original;
        if (updatedBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Updated by <strong>{updatedBy}</strong></span>;
        if (createdBy) return <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Created by <strong>{createdBy}</strong></span>;
        return <span className="text-secondary">—</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="action-buttons">
          <button
            onClick={() => handleUnsetDisplay(row.original.id)}
            title="Remove from display"
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--adm-text-secondary)', padding: '5px 10px', border: '1px solid var(--adm-border)', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
          >
            <EyeOff size={13} /> Remove
          </button>
          <button className="action-btn edit" onClick={() => handleOpenModal(row.original)}><Edit2 size={16} /></button>
          <button className="action-btn delete" onClick={() => handleDelete(row.original)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], [animals]);

  const displayTable = useReactTable({
    data: displayAnimals,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filteredLookup = speciesCodes.filter(sc => {
    const q = lookupSearch.toLowerCase();
    return sc.speciesName.toLowerCase().includes(q) || sc.codeSuffix.toLowerCase().includes(q);
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header-container">
        <div>
          <h1 className="admin-page-title"><PawPrint className="title-icon" size={26} /> Manage Animals</h1>
          <p className="admin-page-subtitle">View, add, edit, or remove zoo animals.</p>
        </div>
        <div className="admin-page-actions">
          <div className="admin-search-container">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Search animals or ID..." className="admin-search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button
            onClick={() => setFilterEndangered(f => !f)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 38, padding: '0 14px',
              background: filterEndangered ? '#fef2f2' : 'var(--adm-bg-surface)',
              color: filterEndangered ? '#b91c1c' : 'var(--adm-text-secondary)',
              border: filterEndangered ? '1px solid #fca5a5' : '1px solid var(--adm-border)',
              borderRadius: 'var(--adm-radius-md)', fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <AlertTriangle size={15} />
            {filterEndangered ? 'Endangered Only' : 'All Animals'}
          </button>
          <button
            onClick={() => { setLookupSearch(''); setIsLookupOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              height: 38, padding: '0 14px',
              background: 'var(--adm-bg-surface)', color: 'var(--adm-text-secondary)',
              border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-radius-md)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <BookOpen size={15} />
            Animal ID Lookup
          </button>
          <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Animal
          </button>
        </div>
      </div>

      {/* ── Section 1: Display Animals ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Eye size={18} style={{ color: 'var(--adm-accent)' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>Display Animals</h2>
          <span className="pill-badge" style={{ background: 'var(--adm-accent-bg, rgba(34,107,64,0.1))', color: 'var(--adm-accent)', fontSize: '0.78rem', padding: '2px 9px', borderRadius: 20 }}>
            {displayAnimals.length}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', marginLeft: 2 }}>Shown on the public website with quick facts</span>
        </div>
        <div className="admin-table-container">
          <div className="admin-table-scroll-inner" style={{ maxHeight: 480 }}>
          <table className="admin-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              {displayTable.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        data-sorted={header.column.getIsSorted() || undefined}
                        style={header.column.columnDef.size ? { maxWidth: header.column.getSize() } : undefined}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon column={header.column} />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="no-hover"><td colSpan={columns.length}>
                  <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading animals...</p></div>
                </td></tr>
              ) : displayTable.getRowModel().rows.length === 0 ? (
                <tr className="no-hover"><td colSpan={columns.length}>
                  <div className="admin-table-empty" style={{ padding: '24px 0' }}>
                    <div className="admin-table-empty-icon"><Eye size={22} /></div>
                    <p className="admin-table-empty-title">No display animals set</p>
                    <p className="admin-table-empty-desc">Click "Set as Display" on an animal below to feature it on the public site.</p>
                  </div>
                </td></tr>
              ) : (
                displayTable.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}
                          style={{
                            ...(cell.column.columnDef.size ? { maxWidth: cell.column.getSize() } : {}),
                            ...(cell.column.id === 'image' ? { paddingRight: 6 } : {}),
                          }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* ── Section 2: All Animals (grouped by species prefix) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <PawPrint size={18} style={{ color: 'var(--adm-text-secondary)' }} />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>All Animals</h2>
          <span className="pill-badge" style={{ fontSize: '0.78rem', padding: '2px 9px', borderRadius: 20 }}>
            {animals.length}
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--adm-text-secondary)', marginLeft: 2 }}>Grouped by species · click "Set as Display" to feature an animal</span>
        </div>

        {isLoading ? (
          <div className="admin-table-loading"><div className="admin-loading-spinner" /><p>Loading animals...</p></div>
        ) : groupedAnimals.length === 0 ? (
          <div className="admin-table-empty">
            <div className="admin-table-empty-icon"><PawPrint size={22} /></div>
            <p className="admin-table-empty-title">No animals found</p>
            <p className="admin-table-empty-desc">{search ? 'Try adjusting your search.' : 'Add your first animal to get started.'}</p>
          </div>
        ) : groupedAnimals.map(group => (
          <div key={group.prefix} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', background: 'var(--adm-bg-surface-2)',
              borderRadius: '8px 8px 0 0', border: '1px solid var(--adm-border)',
              borderBottom: 'none',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--adm-text-primary)', fontSize: '0.9rem' }}>{group.species}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--adm-accent)', background: 'var(--adm-accent-bg, rgba(34,107,64,0.1))', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{group.prefix}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--adm-text-secondary)', marginLeft: 2 }}>{group.animals.length} animal{group.animals.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="admin-table-container" style={{ borderRadius: '0 0 8px 8px', marginTop: 0 }}>
              <table className="admin-table" style={{ borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th>Animal ID</th>
                    <th>Name</th>
                    <th>Age / Sex</th>
                    <th>Exhibit</th>
                    <th>Modified By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.animals.map(animal => (
                    <tr key={animal.id}>
                      <td>
                        {animal.animalCode
                          ? <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--adm-accent)', fontWeight: 700 }}>{animal.animalCode}</span>
                          : <span className="text-secondary">—</span>}
                      </td>
                      <td><span className="font-medium text-dark">{animal.name || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.82rem' }}>
                          <span className="text-secondary">{animal.age ? `${animal.age} yrs` : '—'}</span>
                          <span className="text-secondary">{animal.gender || '—'}</span>
                        </div>
                      </td>
                      <td>
                        {animal.exhibit
                          ? <span className="pill-badge outline">{animal.exhibit}</span>
                          : <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Undecided</span>}
                      </td>
                      <td>
                        {animal.updatedBy
                          ? <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Updated by <strong>{animal.updatedBy}</strong></span>
                          : animal.createdBy
                          ? <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Created by <strong>{animal.createdBy}</strong></span>
                          : <span className="text-secondary">—</span>}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleSetDisplay(animal)}
                            title="Set as display animal"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--adm-accent)', padding: '5px 10px', border: '1px solid var(--adm-accent)', borderRadius: 6, background: 'transparent', cursor: 'pointer' }}
                          >
                            <Eye size={13} /> Display
                          </button>
                          <button className="action-btn edit" onClick={() => handleOpenModal(animal)}><Edit2 size={16} /></button>
                          <button className="action-btn delete" onClick={() => handleDelete(animal)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit Modal ── */}
      <AdminModalForm title={editingAnimal ? 'Edit Animal Record' : 'Add New Animal'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit}>
        {/* Display Animal toggle */}
        <div style={{ background: 'var(--adm-bg-surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, border: '1px solid var(--adm-border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
            <input
              type="checkbox"
              checked={formData.isDisplay}
              onChange={e => setFormData({ ...formData, isDisplay: e.target.checked })}
              style={{ width: 16, height: 16, margin: 0, accentColor: 'var(--adm-accent)', flexShrink: 0 }}
            />
            <span style={{ fontWeight: 600, color: 'var(--adm-text-primary)' }}>Mark as Display Animal</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--adm-text-secondary)', fontWeight: 400 }}>
              — appears on public website with quick facts
            </span>
          </label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Animal Name (optional)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Animal Group</label>
            <input
              type="text"
              list="species-datalist"
              placeholder="e.g. Lion, Elephant..."
              value={formData.species}
              onChange={e => handleSpeciesChange(e.target.value)}
              required
            />
            <datalist id="species-datalist">
              {[...new Set(animals.map(a => a.species).filter(Boolean))].sort().map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>

            {/* Known species — show upcoming Animal ID */}
            {!editingAnimal && !isNewSpecies && animalCodePreview && (
              <small style={{ color: 'var(--adm-accent)', marginTop: 4, display: 'block', fontWeight: 600 }}>
                Animal ID will be: {animalCodePreview}
              </small>
            )}

            {/* Editing — show existing Animal ID read-only */}
            {editingAnimal && animalCodePreview && (
              <small style={{ color: 'var(--adm-text-secondary)', marginTop: 4, display: 'block' }}>
                Animal ID: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--adm-accent)' }}>{animalCodePreview}</span>
              </small>
            )}

            {/* New species — require code suffix */}
            {!editingAnimal && isNewSpecies && formData.species && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--adm-text-secondary)', fontWeight: 500 }}>
                  New species — enter a short code suffix
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder='e.g. "lio" for Lion'
                  value={newCodeSuffix}
                  onChange={e => setNewCodeSuffix(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                />
                {newCodeSuffix && (
                  <small style={{ color: 'var(--adm-text-secondary)' }}>
                    First animal of this species will be: <strong style={{ fontFamily: 'monospace' }}>{newCodeSuffix}-00001</strong>
                  </small>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Species <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>(optional — specific subspecies or common name)</span></label>
          <input
            type="text"
            placeholder="e.g. African Lion, West African Elephant..."
            value={formData.speciesDetail}
            onChange={e => setFormData({ ...formData, speciesDetail: e.target.value })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Age (Years)</label>
            <input type="number" min="0" placeholder="0" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <AdminSelect
              value={formData.gender}
              onChange={val => setFormData({ ...formData, gender: val })}
              options={['Male', 'Female', 'Unknown']}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Assign to Exhibit</label>
            <AdminSelect
              value={formData.exhibit}
              onChange={val => setFormData({ ...formData, exhibit: val })}
              options={[{ value: '', label: 'Select an exhibit...' }, { value: 'Undecided', label: 'Undecided' }, ...exhibits.map(ex => ({ value: ex.ExhibitName, label: ex.ExhibitName }))]}
              placeholder="Select an exhibit..."
            />
          </div>
          <div className="form-group">
            <label>Date Arrived</label>
            <DatePickerInput
              value={formData.dateArrived}
              onChange={val => setFormData({ ...formData, dateArrived: val })}
              placeholder="Select arrival date..."
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Diet Type</label>
            <AdminSelect
              value={formData.diet}
              onChange={val => setFormData({ ...formData, diet: val })}
              options={[{ value: '', label: 'Select diet type...' }, 'Herbivore', 'Carnivore', 'Omnivore']}
            />
          </div>
          <div className="form-group">
            <label>Health Status</label>
            <AdminSelect
              value={formData.health}
              onChange={val => setFormData({ ...formData, health: val })}
              options={['Excellent', 'Good', 'Fair', 'Needs Checkup', 'Critical']}
            />
          </div>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            type="checkbox"
            id="isEndangered"
            checked={formData.isEndangered}
            onChange={e => setFormData({ ...formData, isEndangered: e.target.checked })}
            style={{ width: 16, height: 16, margin: 0, accentColor: '#ef4444', flexShrink: 0 }}
          />
          <label htmlFor="isEndangered" style={{ margin: 0, cursor: 'pointer' }}>
            Mark as <span style={{ color: '#ef4444', fontWeight: 700 }}>Endangered</span>
          </label>
        </div>
        {formData.isDisplay && (
          <>
            <div className="form-group">
              <label>Profile Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview"
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--adm-border)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--adm-bg-surface-2)', border: '1px dashed var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ImageIcon size={22} style={{ color: 'var(--adm-text-muted)' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'block', width: '100%' }} />
                  <small className="text-secondary" style={{ marginTop: 4, display: 'block' }}>If no image is provided, a placeholder will be used.</small>
                </div>
              </div>
            </div>
            <p className="form-section-heading">Quick Facts (Hover Info)</p>
            <div className="form-row">
              <div className="form-group">
                <label>Lifespan</label>
                <input type="text" placeholder="e.g. 10–14 years" value={formData.lifespan} onChange={e => setFormData({ ...formData, lifespan: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Weight</label>
                <input type="text" placeholder="e.g. 265–420 lbs" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Region</label>
                <input type="text" placeholder="e.g. Africa" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Interesting Fact</label>
                <input type="text" placeholder="Short fun fact" value={formData.funFact} onChange={e => setFormData({ ...formData, funFact: e.target.value })} />
              </div>
            </div>
          </>
        )}
      </AdminModalForm>

      {/* ── Animal ID Lookup Modal ── */}
      {isLookupOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--adm-bg-surface)', borderRadius: 14, padding: 28, width: 560, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--adm-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} style={{ color: 'var(--adm-accent)' }} />
                Animal ID Lookup
              </h2>
              <button onClick={() => setIsLookupOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Filter by species or code..."
              value={lookupSearch}
              onChange={e => setLookupSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface-2)', fontSize: '0.875rem', color: 'var(--adm-text-primary)' }}
              autoFocus
            />
            <div style={{ overflowY: 'auto', flex: 1, borderRadius: 8, border: '1px solid var(--adm-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-bg-surface-2)', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--adm-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Species</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--adm-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Code</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--adm-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Assigned ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLookup.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--adm-text-muted)', fontSize: '0.875rem' }}>
                        {lookupSearch ? 'No matching species found.' : 'No species codes registered yet.'}
                      </td>
                    </tr>
                  ) : filteredLookup.map(sc => (
                    <tr key={sc.codeSuffix} style={{ borderBottom: '1px solid var(--adm-border-light)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--adm-text-primary)', fontWeight: 500 }}>{sc.speciesName}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--adm-accent)' }}>{sc.codeSuffix}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: 'var(--adm-text-secondary)' }}>
                        {sc.lastCount > 0 ? `${sc.codeSuffix}-${String(sc.lastCount).padStart(5, '0')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>
              {speciesCodes.length} species registered · codes are assigned automatically when adding animals
            </p>
          </div>
        </div>
      )}

      {/* ── Departure Reason Dialog ── */}
      {departureTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--adm-bg-surface)', borderRadius: 14, padding: 28, width: 420, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--adm-text-primary)' }}>Remove Animal</h2>
                <p style={{ margin: 0, color: 'var(--adm-text-secondary)', fontSize: '0.9rem' }}>
                  Why is <strong style={{ color: 'var(--adm-text-primary)' }}>{departureTarget.name}</strong> leaving the zoo?
                </p>
              </div>
              <button onClick={() => setDepartureTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEPARTURE_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${departureReason === opt.value ? 'var(--adm-accent)' : 'var(--adm-border)'}`, background: departureReason === opt.value ? 'var(--adm-accent-subtle, rgba(34,107,64,0.07))' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="departureReason" value={opt.value} checked={departureReason === opt.value} onChange={() => setDepartureReason(opt.value)} style={{ accentColor: 'var(--adm-accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--adm-text-primary)' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDepartureTarget(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-bg-surface)', color: 'var(--adm-text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={confirmDeparture} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnimals;
