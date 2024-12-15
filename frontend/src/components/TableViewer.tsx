import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  alpha,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  DeleteForever as DeleteForeverIcon,
  CleaningServices as CleaningServicesIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useToast } from '../contexts/ToastContext';

interface TableStructure {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

interface TableData {
  rows: any[];
  total: number;
}

interface TableViewerProps {
  database: string;
  table: string;
  structure: TableStructure[];
  onClose: () => void;
}

interface EditedDataType {
  [key: string]: any;
}

const TableViewer: React.FC<TableViewerProps> = ({ database, table, structure, onClose }) => {
  const [data, setData] = useState<TableData>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<EditedDataType>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTableDialogOpen, setDeleteTableDialogOpen] = useState(false);
  const [cleanTableDialogOpen, setCleanTableDialogOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const showToast = useToast();

  const loadTableData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = page * rowsPerPage;
      
      const baseUrl = 'http://localhost:3000/api';
      const url = `${baseUrl}/databases/${encodeURIComponent(database)}/tables/${encodeURIComponent(table)}/data`;
      const queryParams = new URLSearchParams({
        offset: offset.toString(),
        limit: rowsPerPage.toString(),
        search: searchQuery
      });

      console.log('Loading data from URL:', `${url}?${queryParams}`); // Debug log

      const response = await fetch(`${url}?${queryParams}`);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error;
        } catch (e) {
          errorMessage = response.statusText || 'Failed to load table data';
        }
        throw new Error(errorMessage || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Ensure the result has the expected structure
      const formattedData = {
        rows: Array.isArray(result.data) ? result.data : [],
        total: typeof result.total === 'number' ? result.total : 0
      };
      
      setData(formattedData);
    } catch (err) {
      console.error('Error loading table data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load table data');
      showToast(err instanceof Error ? err.message : 'Failed to load table data', 'error');
    } finally {
      setLoading(false);
    }
  }, [database, table, page, rowsPerPage, searchQuery, showToast]);

  // Load initial data
  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTableData();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  // Load data when dependencies change
  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  // Ensure structure is valid
  useEffect(() => {
    if (!Array.isArray(structure)) {
      console.error('Invalid table structure:', structure);
      setError('Invalid table structure');
    }
  }, [structure]);

  // Handle row selection for delete
  const handleDeleteClick = (row: any) => {
    console.log('Delete clicked for row:', row); // Debug log
    setSelectedRecord(row);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!selectedRecord) {
      console.error('No record selected for deletion');
      return;
    }
    
    try {
      setDeleting(true);
      
      // Find primary key field and value
      const primaryKeyField = structure.find(col => col.Key === 'PRI')?.Field;
      if (!primaryKeyField) {
        throw new Error('No primary key found in table');
      }
      
      const id = selectedRecord[primaryKeyField];
      if (!id) {
        throw new Error('Record ID not found');
      }

      const baseUrl = 'http://localhost:3000/api';
      const url = `${baseUrl}/databases/${encodeURIComponent(database)}/tables/${encodeURIComponent(table)}/records/${encodeURIComponent(id)}`;
      
      console.log('Deleting record at URL:', url); // Debug log

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showToast('Record deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
      await loadTableData();
    } catch (err) {
      console.error('Error deleting record:', err);
      showToast(err instanceof Error ? err.message : 'An unknown error occurred', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Handle row selection for edit
  const handleEditClick = (index: number) => {
    console.log('Edit clicked for index:', index); // Debug log
    if (!data?.rows?.[index]) {
      console.error('Invalid row index or missing data');
      return;
    }
    setEditingRow(index);
    setEditedData({ ...data.rows[index] });
    console.log('Set edited data:', data.rows[index]); // Debug log
  };

  // Handle field value changes
  const handleFieldChange = (field: string, value: any) => {
    console.log('Field change:', field, value); // Debug log
    setEditedData((prevData: EditedDataType) => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleSave = async (rowIndex: number) => {
    if (rowIndex === null) return;
    try {
      setSaving(true);
      const isNewRecord = rowIndex === -1;
      
      // Find primary key field
      const primaryKeyField = structure.find(col => col.Key === 'PRI')?.Field;
      if (!primaryKeyField && !isNewRecord) {
        throw new Error('No primary key found in table');
      }

      // Construct the base endpoint URL
      const baseUrl = 'http://localhost:3000/api';
      let url = `${baseUrl}/databases/${encodeURIComponent(database)}/tables/${encodeURIComponent(table)}/records`;
      let method = 'POST';

      // For updates, include the primary key in the URL
      if (!isNewRecord && primaryKeyField) {
        const id = data?.rows?.[rowIndex]?.[primaryKeyField];
        if (!id) {
          throw new Error('Record ID not found');
        }
        url = `${url}/${encodeURIComponent(id)}`;
        method = 'PUT';
        // Remove primary key from body for updates
        delete editedData[primaryKeyField];
      }

      // Initialize default values for required fields
      const recordToSave = { ...editedData };
      structure.forEach(field => {
        if (field.Null === 'NO' && recordToSave[field.Field] === undefined) {
          // Set default values based on field type
          switch (field.Type.toLowerCase()) {
            case 'int':
            case 'bigint':
            case 'tinyint':
              recordToSave[field.Field] = 0;
              break;
            case 'varchar':
            case 'text':
              recordToSave[field.Field] = '';
              break;
            case 'datetime':
              recordToSave[field.Field] = new Date().toISOString().slice(0, 19).replace('T', ' ');
              break;
            default:
              recordToSave[field.Field] = null;
          }
        }
      });

      console.log('Saving to URL:', url); // Debug log
      console.log('Record data:', recordToSave); // Debug log
      console.log('Method:', method); // Debug log

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordToSave),
      });

      let errorMessage;
      let responseData;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
          errorMessage = responseData.message || responseData.error;
        } catch (e) {
          console.error('JSON parse error:', e);
          errorMessage = 'Invalid response format from server';
        }
      } else {
        errorMessage = response.statusText || `Failed to ${isNewRecord ? 'create' : 'update'} record`;
      }

      if (!response.ok) {
        throw new Error(errorMessage || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Refresh the data after successful save
      await loadTableData();
      setEditingRow(null);
      setEditedData({});
      showToast(`Record ${isNewRecord ? 'created' : 'updated'} successfully`, 'success');
    } catch (error) {
      console.error('Save error:', error);
      showToast(error instanceof Error ? error.message : 'An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleCleanTable = async () => {
    try {
      setCleaning(true);
      const baseUrl = 'http://localhost:3000/api';
      const url = `${baseUrl}/databases/${encodeURIComponent(database)}/tables/${encodeURIComponent(table)}/clear`;
      
      console.log('Cleaning table at URL:', url); // Debug log

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showToast('Table cleared successfully', 'success');
      setCleanTableDialogOpen(false);
      await loadTableData();
    } catch (err) {
      console.error('Error clearing table:', err);
      showToast(err instanceof Error ? err.message : 'An unknown error occurred', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteTable = async () => {
    try {
      setDeleting(true);
      const baseUrl = 'http://localhost:3000/api';
      const url = `${baseUrl}/databases/${encodeURIComponent(database)}/tables/${encodeURIComponent(table)}`;
      
      console.log('Deleting table at URL:', url); // Debug log

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let errorMessage;
      try {
        const data = await response.json();
        errorMessage = data.message;
      } catch (e) {
        errorMessage = response.statusText || 'Failed to delete table';
      }

      if (!response.ok) {
        throw new Error(errorMessage || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      showToast('Table deleted successfully', 'success');
      setDeleteTableDialogOpen(false);
      onClose();
    } catch (err) {
      console.error('Error deleting table:', err);
      showToast(err instanceof Error ? err.message : 'An unknown error occurred', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <StorageIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {table}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading table data...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Card
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 1200,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: theme.shadows[24],
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Table Toolbar */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Table Title and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {table}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.text.primary },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditedData({});
                setEditingRow(-1);
              }}
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.success.main, 0.2),
                },
              }}
            >
              Add Record
            </Button>

            <Button
              size="small"
              startIcon={<CleaningServicesIcon />}
              onClick={() => setCleanTableDialogOpen(true)}
              sx={{
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.warning.main, 0.2),
                },
              }}
            >
              Clear Table
            </Button>

            <Button
              size="small"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setDeleteTableDialogOpen(true)}
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              Delete Table
            </Button>

            {/* Search Field */}
            <TextField
              size="small"
              placeholder="Search records..."
              value={searchQuery}
              onChange={handleSearch}
              sx={{
                width: { xs: 120, sm: 200 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={editingRow !== null} 
          onClose={handleCancelEdit}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            {editingRow === -1 ? (
              <>
                <AddIcon sx={{ color: theme.palette.success.main }} />
                Add New Record
              </>
            ) : (
              <>
                <EditIcon sx={{ color: theme.palette.primary.main }} />
                Edit Record
              </>
            )}
          </DialogTitle>
          <DialogContent sx={{ pt: '20px !important' }}>
            <Grid container spacing={2}>
              {structure.map((col) => (
                <Grid item xs={12} sm={6} key={col.Field}>
                  <TextField
                    fullWidth
                    size="small"
                    label={col.Field}
                    value={editedData[col.Field] || ''}
                    onChange={(e) =>
                      handleFieldChange(col.Field, e.target.value)
                    }
                    disabled={saving || col.Key === 'PRI'}
                    required={col.Null === 'NO'}
                    helperText={col.Type}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={handleCancelEdit}
              disabled={saving}
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingRow !== null) {
                  handleSave(editingRow);
                }
              }}
              disabled={saving}
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : null}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        >
          <DialogTitle sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <WarningIcon sx={{ color: theme.palette.error.main }} />
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this record? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              color="error"
              variant="contained"
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Table Container */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            bgcolor: 'background.paper',
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[2],
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 4,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.3),
              },
            },
          }}
        >
          {Array.isArray(structure) ? (
            <Table
              stickyHeader
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  borderColor: alpha(theme.palette.divider, 0.1),
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  transition: 'all 0.2s',
                },
                '& .MuiTableRow-root:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  '& .MuiTableCell-root': {
                    color: theme.palette.text.primary,
                  },
                },
                '& .MuiTableRow-root:nth-of-type(odd)': {
                  bgcolor: alpha(theme.palette.background.default, 0.4),
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      width: { xs: 100, sm: 120 },
                      bgcolor: alpha(theme.palette.background.paper, 0.95),
                      backdropFilter: 'blur(8px)',
                      position: 'sticky',
                      left: 0,
                      top: 0,
                      zIndex: 3,
                      borderBottom: 2,
                      borderBottomColor: theme.palette.primary.main,
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        bgcolor: theme.palette.divider,
                      },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Actions
                    </Typography>
                  </TableCell>
                  {structure.map((col) => (
                    <TableCell
                      key={col.Field}
                      sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        width: {
                          xs: col.Key === 'PRI' ? 140 : 200,
                          sm: col.Key === 'PRI' ? 160 : 240,
                          md: col.Key === 'PRI' ? 180 : 280,
                        },
                        borderBottom: 2,
                        borderBottomColor: theme.palette.primary.main,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {col.Field}
                        </Typography>
                        {col.Key === 'PRI' && (
                          <Chip
                            label="PK"
                            size="small"
                            sx={{
                              height: { xs: 16, sm: 20 },
                              fontSize: { xs: '0.625rem', sm: '0.75rem' },
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 'auto',
                            color: alpha(theme.palette.text.secondary, 0.8),
                            fontFamily: 'monospace',
                            fontSize: { xs: '0.625rem', sm: '0.75rem' },
                            display: { xs: 'none', sm: 'block' },
                          }}
                        >
                          {col.Type}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell 
                      colSpan={structure.length + 1} 
                      align="center" 
                      sx={{ py: { xs: 4, sm: 8 } }}
                    >
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell 
                      colSpan={structure.length + 1} 
                      align="center" 
                      sx={{ py: { xs: 4, sm: 8 } }}
                    >
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : !data || data.rows.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={structure.length + 1} 
                      align="center" 
                      sx={{ py: { xs: 4, sm: 8 } }}
                    >
                      <Typography color="text.secondary">
                        {searchQuery ? 'No matching records found' : 'No records available'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.rows.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        position: 'relative',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          '& .MuiTableCell-root': {
                            color: theme.palette.text.primary,
                          },
                        },
                        '&:nth-of-type(odd)': {
                          bgcolor: alpha(theme.palette.background.default, 0.4),
                        },
                      }}
                    >
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(index)}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(row)}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      {structure.map((col) => (
                        <TableCell 
                          key={col.Field}
                          sx={{
                            maxWidth: { xs: 200, sm: 300 },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: theme.palette.text.secondary,
                            transition: 'all 0.2s',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            ...(col.Key === 'PRI' && {
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                            }),
                            ...(editingRow === index && {
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            }),
                          }}
                        >
                          {editingRow === index ? (
                            <TextField
                              size="small"
                              fullWidth
                              value={editedData[col.Field] || ''}
                              onChange={(e) =>
                                handleFieldChange(col.Field, e.target.value)
                              }
                              disabled={saving || col.Key === 'PRI'}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  bgcolor: 'background.paper',
                                  '& .MuiOutlinedInput-input': {
                                    py: { xs: 0.5, sm: 1 },
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main,
                                  },
                                },
                              }}
                            />
                          ) : (
                            <Tooltip 
                              title={row[col.Field]} 
                              arrow
                              placement="top"
                              enterDelay={500}
                            >
                              <Box
                                component="span"
                                sx={{
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row[col.Field]}
                              </Box>
                            </Tooltip>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error">Invalid table structure</Typography>
            </Box>
          )}
        </Box>

        {/* Pagination */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            backdropFilter: 'blur(8px)',
          }}
        >
          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{
              '.MuiTablePagination-select': {
                bgcolor: 'background.paper',
                borderRadius: 1,
                px: 1,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              },
              '.MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: theme.palette.text.secondary,
              },
            }}
          />
        </Box>

        {/* Clear Table Dialog */}
        <Dialog
          open={cleanTableDialogOpen}
          onClose={() => setCleanTableDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        >
          <DialogTitle sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <WarningIcon sx={{ color: theme.palette.warning.main }} />
            Clear Table
          </DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Are you sure you want to clear all records from the table "{table}"?
            </Typography>
            <Typography color="error" variant="body2">
              This action cannot be undone!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => setCleanTableDialogOpen(false)}
              disabled={cleaning}
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCleanTable}
              disabled={cleaning}
              color="warning"
              variant="contained"
              startIcon={cleaning ? <CircularProgress size={16} /> : <CleaningServicesIcon />}
            >
              {cleaning ? 'Clearing...' : 'Clear Table'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Table Dialog */}
        <Dialog
          open={deleteTableDialogOpen}
          onClose={() => setDeleteTableDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        >
          <DialogTitle sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <WarningIcon sx={{ color: theme.palette.error.main }} />
            Delete Table
          </DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Are you sure you want to delete the table "{table}"?
            </Typography>
            <Typography color="error" variant="body2">
              This will permanently delete the table and all its data. This action cannot be undone!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteTableDialogOpen(false)}
              disabled={deleting}
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTable}
              disabled={deleting}
              color="error"
              variant="contained"
              startIcon={deleting ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
            >
              {deleting ? 'Deleting...' : 'Delete Table'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Card>
  );
};

export default TableViewer;
