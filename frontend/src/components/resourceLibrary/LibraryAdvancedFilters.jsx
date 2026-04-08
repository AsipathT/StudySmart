import React from 'react';
import { Button, Collapse, Input, Select } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';

const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'PDF', label: 'PDF' },
  { value: 'PPT', label: 'PPT' },
  { value: 'NOTES', label: 'Notes' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'FLASHCARDS', label: 'Flashcards' },
];

const FLASHCARD_TYPE_OPTIONS = [
  { value: '', label: 'All document types' },
  { value: 'PDF', label: 'PDF' },
  { value: 'PPT', label: 'PPT' },
  { value: 'NOTES', label: 'Notes' },
];

/**
 * variant: 'resources' | 'notes' | 'flashcards'
 */
const LibraryAdvancedFilters = ({
  variant = 'resources',
  filters,
  onChange,
  onClear,
  programmeOptions = [],
  moduleOptions = [],
}) => {
  const patch = (partial) => onChange({ ...filters, ...partial });

  const showType = variant === 'resources' || variant === 'flashcards';
  const typeOptions = variant === 'flashcards' ? FLASHCARD_TYPE_OPTIONS : RESOURCE_TYPE_OPTIONS;

  return (
    <div className="rl-advanced-filters">
      <Collapse
        bordered={false}
        className="rl-advanced-filters__collapse"
        defaultActiveKey={['filters']}
        items={[
          {
            key: 'filters',
            label: (
              <span className="rl-advanced-filters__title">
                <FilterOutlined aria-hidden />
                <span className="rl-advanced-filters__sr-only">Filters</span>
              </span>
            ),
            extra: (
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                className="rl-advanced-filters__clear"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              >
                Clear all
              </Button>
            ),
            children: (
              <div className="rl-advanced-filters__grid">
                <div className="rl-advanced-filters__field rl-advanced-filters__field--search">
                  <label className="rl-advanced-filters__label" htmlFor={`rl-af-search-${variant}`}>
                    Search
                  </label>
                  <Input
                    id={`rl-af-search-${variant}`}
                    size="large"
                    allowClear
                    placeholder="Title or description…"
                    value={filters.search}
                    onChange={(e) => patch({ search: e.target.value })}
                    className="rl-advanced-filters__search-input"
                  />
                </div>
                <div
                  className={`rl-advanced-filters__row${showType ? '' : ' rl-advanced-filters__row--two'}`}
                >
                  <div className="rl-advanced-filters__field">
                    <label className="rl-advanced-filters__label">Programme</label>
                    <Select
                      allowClear
                      placeholder="All programmes"
                      options={programmeOptions}
                      value={filters.programmeId || undefined}
                      onChange={(programmeId) => patch({ programmeId: programmeId || undefined, moduleId: undefined })}
                    />
                  </div>
                  <div className="rl-advanced-filters__field">
                    <label className="rl-advanced-filters__label">Module</label>
                    <Select
                      allowClear
                      placeholder="All modules"
                      options={moduleOptions}
                      value={filters.moduleId || undefined}
                      onChange={(moduleId) => patch({ moduleId: moduleId || undefined })}
                    />
                  </div>
                  {showType ? (
                    <div className="rl-advanced-filters__field">
                      <label className="rl-advanced-filters__label">Type</label>
                      <Select
                        options={typeOptions}
                        value={filters.type ?? ''}
                        onChange={(type) => patch({ type: type || undefined })}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default LibraryAdvancedFilters;

export const defaultLibraryFilters = {
  search: '',
  programmeId: undefined,
  moduleId: undefined,
  type: undefined,
};

export const defaultNoteFilters = {
  search: '',
  programmeId: undefined,
  moduleId: undefined,
};

export function matchesLibraryFilters(r, f, { includeType = true } = {}) {
  if (!r) return false;
  const q = (f.search || '').trim().toLowerCase();
  if (q) {
    const title = String(r.title || '').toLowerCase();
    const desc = String(r.description || '').toLowerCase();
    if (!title.includes(q) && !desc.includes(q)) return false;
  }
  if (f.programmeId && String(r.programmeId) !== String(f.programmeId)) return false;
  if (f.moduleId && String(r.moduleId) !== String(f.moduleId)) return false;
  if (includeType && f.type && String(r.type || '').toUpperCase() !== String(f.type).toUpperCase()) return false;
  return true;
}
