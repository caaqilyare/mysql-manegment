import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
  Box,
  Paper,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Column {
  id: string;
  name: string;
  type: string;
  constraints: string[];
}

interface TableManagerProps {
  open: boolean;
  onClose: () => void;
  onCreateTable: (tableName: string, columns: Column[]) => void;
  database: string;
}

const dataTypes = [
  'INTEGER',
  'TEXT',
  'REAL',
  'BLOB',
  'VARCHAR(255)',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'DECIMAL(10,2)',
  'CHAR(1)',
  'TINYINT',
  'BIGINT',
];

const constraints = [
  'PRIMARY KEY',
  'NOT NULL',
  'UNIQUE',
  'DEFAULT NULL',
  'AUTO_INCREMENT',
];

const SortableColumnItem = ({ column, index, onRemove, onChange }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={2}
      sx={{ p: 2, mb: 2, backgroundColor: 'background.paper' }}
      style={style}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
          <DragIcon color="action" />
        </Box>
        
        <TextField
          label="Column Name"
          value={column.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          sx={{ flex: 1 }}
        />
        
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={column.type}
            label="Type"
            onChange={(e) => onChange(index, 'type', e.target.value)}
          >
            {dataTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Constraints</InputLabel>
          <Select
            multiple
            value={column.constraints}
            label="Constraints"
            onChange={(e) =>
              onChange(
                index,
                'constraints',
                typeof e.target.value === 'string'
                  ? [e.target.value]
                  : e.target.value
              )
            }
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value: string) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {constraints.map((constraint) => (
              <MenuItem key={constraint} value={constraint}>
                {constraint}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {index !== 0 && (
          <IconButton
            onClick={() => onRemove(index)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
};

export const TableManager: React.FC<TableManagerProps> = ({
  open,
  onClose,
  onCreateTable,
  database,
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    { 
      id: '1',
      name: 'id',
      type: 'INTEGER',
      constraints: ['PRIMARY KEY', 'AUTO_INCREMENT']
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        id: Date.now().toString(),
        name: '',
        type: 'TEXT',
        constraints: []
      }
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (
    index: number,
    field: keyof Column,
    value: string | string[]
  ) => {
    const newColumns = [...columns];
    newColumns[index] = {
      ...newColumns[index],
      [field]: value,
    };
    setColumns(newColumns);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    if (tableName && columns.every((col) => col.name && col.type)) {
      onCreateTable(tableName, columns);
      onClose();
      setTableName('');
      setColumns([
        {
          id: '1',
          name: 'id',
          type: 'INTEGER',
          constraints: ['PRIMARY KEY', 'AUTO_INCREMENT']
        },
      ]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create New Table in {database}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Table Name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Columns
          </Typography>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map(col => col.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.map((column, index) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  index={index}
                  onRemove={handleRemoveColumn}
                  onChange={handleColumnChange}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddColumn}
              variant="outlined"
            >
              Add Column
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!tableName || columns.some((col) => !col.name || !col.type)}
            >
              Create Table
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TableManager;
