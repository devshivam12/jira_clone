// Every filter the List view offers, in the order the "Filter" menu lists them.
//
// Like the column list, this is the only place a filter is described. The menu,
// the chips in the toolbar and the request sent to the server are all built
// from it, so a new filter is one entry here plus, if it is a new field, one
// line in the server's buildConditions.
//
// Fields of an entry:
//   id       stable key, used by the menu and by the chip
//   label    what the user reads
//   kind     how the values are picked:
//              'options' - a fixed list that comes with the project template
//              'remote'  - a searchable list read from the server
//              'boolean' - yes / no
//              'dates'   - a from and a to date
//              'text'    - free text
//   valueKey the field in the request payload holding the chosen values. Lists
//            of ids or slugs for 'options' and 'remote', true/false for
//            'boolean', a string for 'text'.
//   source   which option list a 'options' filter reads ('status',
//            'importance', 'workType')
//   remote   which server list a 'remote' filter reads. See FILTER_SOURCES in
//            FilterOptionList.jsx.
//   fromKey / toKey  the two payload fields of a 'dates' filter
export const LIST_FILTERS = [
    {
        id: 'status',
        label: 'Status',
        kind: 'options',
        source: 'status',
        valueKey: 'statuses'
    },
    {
        // Priority and importance are the same field on a work item in this
        // project, so they are offered once under the name the boards use.
        id: 'priority',
        label: 'Priority',
        kind: 'options',
        source: 'importance',
        valueKey: 'importance'
    },
    {
        id: 'workType',
        label: 'Work type',
        kind: 'options',
        source: 'workType',
        valueKey: 'workTypes'
    },
    {
        id: 'assignee',
        label: 'Assignee',
        kind: 'remote',
        remote: 'member',
        valueKey: 'assigneeIds'
    },
    {
        id: 'reporter',
        label: 'Reporter',
        kind: 'remote',
        remote: 'member',
        valueKey: 'reporterIds'
    },
    {
        id: 'parent',
        label: 'Parent',
        kind: 'remote',
        remote: 'parent',
        valueKey: 'parentIds'
    },
    {
        id: 'team',
        label: 'Team',
        kind: 'remote',
        remote: 'team',
        valueKey: 'teamIds'
    },
    {
        id: 'sprint',
        label: 'Sprint',
        kind: 'remote',
        remote: 'sprint',
        valueKey: 'sprintIds'
    },
    {
        id: 'label',
        label: 'Label',
        kind: 'remote',
        remote: 'label',
        valueKey: 'labels'
    },
    {
        id: 'flagged',
        label: 'Flagged',
        kind: 'boolean',
        valueKey: 'flagged'
    },
    {
        id: 'created',
        label: 'Created date',
        kind: 'dates',
        fromKey: 'createdFrom',
        toKey: 'createdTo'
    },
    {
        id: 'start',
        label: 'Start date',
        kind: 'dates',
        fromKey: 'startFrom',
        toKey: 'startTo'
    },
    {
        id: 'due',
        label: 'Due date',
        kind: 'dates',
        fromKey: 'dueFrom',
        toKey: 'dueTo'
    },
    {
        // The same value the search box holds. It is offered here as well
        // because people look for it in the filter menu, and both places
        // writing to one value keeps them from disagreeing.
        id: 'summary',
        label: 'Summary',
        kind: 'text',
        valueKey: 'search'
    }
];

export const FILTER_BY_ID = LIST_FILTERS.reduce((map, filter) => {
    map[filter.id] = filter;
    return map;
}, {});

// The payload keys a filter owns, so clearing or counting a filter does not
// have to know its kind.
export const filterPayloadKeys = (filter) => (
    filter.kind === 'dates' ? [filter.fromKey, filter.toKey] : [filter.valueKey]
);

// True when this filter is actually narrowing the list. An empty list, an empty
// string and an unset value all read as "not in use".
export const isFilterInUse = (filter, values) => filterPayloadKeys(filter).some((key) => {
    const value = values[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value !== undefined && value !== null;
});
