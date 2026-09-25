// Every column the List view can show, in the order they appear on screen.
//
// This list is the only place a column is described. The table header, the
// cells and the "manage columns" menu are all built from it, so adding a
// column means adding one entry here - nothing else has to be touched.
//
// Fields of an entry:
//   id        stable key, used in the column menu and in the saved preference
//   label     the column heading
//   width     column width in pixels (a column keeps the same width in the
//             header and in every row, which is what keeps them lined up)
//   type      how the cell is drawn and edited, see ListCell.jsx
//   field     the property on the row the cell reads
//   updateKey the key sent to the updateTask mutation when the cell is edited.
//             A column without one is read only.
//   options   which option list the cell picks from ('status', 'importance'
//             or 'workType'), for the select style cells
//   slug      which dropdown the cell opens ('parent', 'team', 'sprint')
//   sortKey   what the server sorts by when the heading is clicked. A column
//             without one cannot be sorted.
//   locked    cannot be hidden. The key holds the drill down control and the
//             summary is the name of the item, so the list stops making sense
//             without them.
export const LIST_COLUMNS = [
    {
        id: 'key',
        label: 'Key',
        width: 150,
        type: 'key',
        field: 'taskNumber',
        sortKey: 'key',
        locked: true
    },
    {
        id: 'summary',
        label: 'Summary',
        width: 380,
        type: 'text',
        field: 'summary',
        updateKey: 'summary',
        sortKey: 'summary',
        locked: true
    },
    {
        id: 'status',
        label: 'Status',
        width: 150,
        type: 'options',
        field: 'task_status',
        updateKey: 'task_status',
        options: 'status',
        sortKey: 'status'
    },
    {
        id: 'priority',
        label: 'Priority',
        width: 150,
        type: 'options',
        field: 'importance',
        updateKey: 'importance',
        options: 'importance',
        sortKey: 'priority'
    },
    {
        id: 'workType',
        label: 'Work type',
        width: 150,
        type: 'options',
        field: 'work_type',
        updateKey: 'work_type',
        options: 'workType',
        sortKey: 'workType'
    },
    {
        id: 'assignee',
        label: 'Assignee',
        width: 180,
        type: 'member',
        field: 'assigneeDetail',
        updateKey: 'assigneeId',
        sortKey: 'assignee'
    },
    {
        id: 'reporter',
        label: 'Reporter',
        width: 180,
        type: 'member',
        field: 'reporterDetail',
        updateKey: 'reporterId',
        sortKey: 'reporter'
    },
    {
        id: 'parent',
        label: 'Parent',
        width: 200,
        type: 'entity',
        field: 'parentDetail',
        updateKey: 'parentId',
        slug: 'parent',
        sortKey: 'parent'
    },
    {
        id: 'team',
        label: 'Team',
        width: 170,
        type: 'entity',
        field: 'teamDetail',
        updateKey: 'teamId',
        slug: 'team',
        sortKey: 'team'
    },
    {
        id: 'sprint',
        label: 'Sprint',
        width: 170,
        type: 'entity',
        field: 'sprintDetail',
        updateKey: 'sprintId',
        slug: 'sprint'
    },
    {
        id: 'labels',
        label: 'Labels',
        width: 220,
        type: 'labels',
        field: 'labels',
        updateKey: 'labels'
    },
    {
        id: 'startDate',
        label: 'Start date',
        width: 150,
        type: 'date',
        field: 'startDate',
        updateKey: 'startDate',
        sortKey: 'startDate'
    },
    {
        id: 'dueDate',
        label: 'Due date',
        width: 150,
        type: 'date',
        field: 'dueDate',
        updateKey: 'dueDate',
        sortKey: 'dueDate'
    },
    {
        id: 'flagged',
        label: 'Flagged',
        width: 110,
        type: 'flag',
        field: 'isFlagged'
    },
    {
        id: 'createdAt',
        label: 'Created',
        width: 150,
        type: 'readDate',
        field: 'createdAt',
        sortKey: 'createdAt'
    },
    {
        id: 'updatedAt',
        label: 'Updated',
        width: 150,
        type: 'readDate',
        field: 'updatedAt',
        sortKey: 'updatedAt'
    },
    {
        id: 'createdBy',
        label: 'Created by',
        width: 180,
        type: 'readMember',
        field: 'creatorDetail'
    },
    {
        id: 'estimate',
        label: 'Estimate',
        width: 120,
        type: 'readNumber',
        field: 'estimate'
    },
    {
        id: 'timeSpent',
        label: 'Time spent',
        width: 130,
        type: 'readNumber',
        field: 'timeSpent'
    },
    {
        id: 'childItems',
        label: 'Child items',
        width: 120,
        type: 'readNumber',
        field: 'childCount'
    }
];

// What a user sees the first time they open the list. Enough to be useful on a
// laptop screen without needing a sideways scroll; everything else is one click
// away in the column menu.
export const DEFAULT_COLUMN_IDS = [
    'key',
    'summary',
    'status',
    'priority',
    'assignee',
    'dueDate',
    'flagged'
];

export const LOCKED_COLUMN_IDS = LIST_COLUMNS.filter((column) => column.locked).map((column) => column.id);

// Width of the area in front of the first column that holds the open/close
// arrow, plus how far a child row is pushed in from its parent.
export const EXPANDER_WIDTH = 38;
export const INDENT_PER_LEVEL = 22;
