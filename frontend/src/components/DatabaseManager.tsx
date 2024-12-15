import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  useTheme,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  TableChart as TableIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import TableViewer from './TableViewer';
import { useToast } from '../contexts/ToastContext';
import { LoadingButton } from '@mui/lab';

export const DatabaseManager = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('error');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteTableDialogOpen, setDeleteTableDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [deletingTable, setDeletingTable] = useState(false);
  const [tableStructure, setTableStructure] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDb) {
      fetchTables(selectedDb);
    }
  }, [selectedDb]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableStructure(selectedDb, selectedTable);
    }
  }, [selectedTable]);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/databases');
      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }
      const data = await response.json();
      console.log('Database response:', data);
      
      // Extract database names from the response
      const dbNames = Array.isArray(data) 
        ? data.map(db => db.Database || '').filter(name => name !== '')
        : [];
      
      console.log('Processed database names:', dbNames);
      setDatabases(dbNames);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to fetch databases');
      setShowError(true);
    }
  };

  const fetchTables = async (database: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3000/api/databases/${database}/tables`);
      const data = await response.json();
      setTables(data.map((table: any) => table[`Tables_in_${database}`]));
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to fetch tables');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableStructure = async (database: string, table: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3000/api/databases/${database}/tables/${table}/structure`);
      if (!response.ok) {
        throw new Error('Failed to fetch table structure');
      }
      const data = await response.json();
      setTableStructure(Array.isArray(data.structure) ? data.structure : []);
    } catch (error) {
      console.error('Error fetching table structure:', error);
      setError('Failed to fetch table structure');
      setShowError(true);
      setTableStructure([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDbName.trim() }),
      });
      if (!response.ok) throw new Error('Failed to create database');
      await fetchDatabases();
      setCreateDialogOpen(false);
      setNewDbName('');
    } catch (error) {
      setError('Failed to create database');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDatabase = async (dbToDelete: string) => {
    if (!dbToDelete) return;
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/databases/${dbToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete database');
      
      // If we're deleting the currently selected database, clear the selection
      if (dbToDelete === selectedDb) {
        setSelectedDb('');
        setSelectedTable(null);
      }
      
      await fetchDatabases();
      setDeleteDialogOpen(false);
    } catch (error) {
      setError('Failed to delete database');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDatabase = async () => {
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImporting(true);
      const response = await fetch(`http://localhost:3000/api/import`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import database');
      }

      await fetchDatabases();
      setImportDialogOpen(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSnackbarMessage('Database imported successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Import error:', error);
      setSnackbarMessage(error.message || 'Failed to import database');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setImporting(false);
    }
  };

  const handleExportDatabase = async (dbName: string) => {
    try {
      setExporting(true);
      const response = await fetch(`http://localhost:3000/api/databases/${dbName}/export`, {
        method: 'GET',
      });

      // Check if the response is JSON (error) or blob (success)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to export database');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dbName}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbarMessage('Database exported successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Export error:', error);
      setSnackbarMessage(error.message || 'Failed to export database');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    setTableToDelete(tableName);
    setDeleteTableDialogOpen(true);
  };

  const handleConfirmDeleteTable = async () => {
    if (!selectedDb || !tableToDelete) return;

    try {
      setDeletingTable(true);
      const response = await fetch(`http://localhost:3000/api/databases/${selectedDb}/tables/${tableToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete table');
      }

      setSnackbarMessage(`Table ${tableToDelete} deleted successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh tables list
      if (selectedDb) {
        await fetchTables(selectedDb);
      }
      setSelectedTable(null);
    } catch (error: any) {
      console.error('Delete table error:', error);
      setSnackbarMessage(error.message || 'Failed to delete table');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDeletingTable(false);
      setDeleteTableDialogOpen(false);
      setTableToDelete(null);
    }
  };

  const handleDatabaseClick = async (database: string) => {
    setSelectedDb(database);
    setSelectedTable(null);
    await fetchTables(database);
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const ImportDialog = () => (
    <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)}>
      <DialogTitle>Import Database</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <input
            type="file"
            accept=".sql"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImportFile(file);
              }
            }}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            startIcon={<UploadIcon />}
            disabled={importing}
          >
            Select SQL File
          </Button>
          {importFile && (
            <Typography sx={{ mt: 2 }}>
              Selected file: {importFile.name}
            </Typography>
          )}
          {importing && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Importing database...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleImportDatabase}
          loading={importing}
          disabled={!importFile}
          variant="contained"
        >
          Import
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Sidebar - Databases Only */}
      <Box
        sx={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Database Actions */}
        <Box
          sx={{
            p: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
          }}
        >
          <LoadingButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            loading={isLoading}
            loadingPosition="start"
            sx={{
              background: 'linear-gradient(45deg, #6C63FF, #FF6584)',
              '&:hover': {
                background: 'linear-gradient(45deg, #8B85FF, #FF8DA3)',
              },
            }}
          >
            Create
          </LoadingButton>
          <LoadingButton
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!selectedDb}
            loading={isLoading}
            loadingPosition="start"
          >
            Delete
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            loading={importing}
            loadingPosition="start"
            sx={{ color: 'primary.main' }}
          >
            Import
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportDatabase(selectedDb)}
            disabled={!selectedDb}
            loading={exporting}
            loadingPosition="start"
            sx={{ color: 'primary.main' }}
          >
            Export
          </LoadingButton>
        </Box>

        {/* Database List */}
        <Box sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            DATABASES
            {!selectedTable && (
              <IconButton
                size="small"
                onClick={fetchDatabases}
                sx={{
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            )}
          </Typography>
          <Box
            sx={{
              maxHeight: 'calc(100vh - 100px)',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
          >
            <List dense disablePadding>
              {databases.map((db) => (
                <ListItem
                  key={db}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDatabase(db);
                        }}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemButton
                    selected={selectedDb === db}
                    onClick={() => handleDatabaseClick(db)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                      <DatabaseIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={db}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { fontWeight: selectedDb === db ? 600 : 400 },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {selectedDb ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(108, 99, 255, 0.08), transparent 70%)',
                pointerEvents: 'none',
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    textShadow: '0 0 20px rgba(108, 99, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <DatabaseIcon sx={{ fontSize: 32 }} />
                  {selectedDb}
                </Typography>
                {selectedTable ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mt: 1,
                    mb: 1,
                  }}>
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                      Table: {selectedTable}
                    </Typography>
                    <LoadingButton
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteTable(selectedTable)}
                      loading={deletingTable}
                      sx={{
                        minHeight: '32px',
                        textTransform: 'none',
                        zIndex: 2,
                        position: 'relative',
                        '&:hover': {
                          backgroundColor: theme.palette.error.dark,
                        },
                      }}
                    >
                      Delete Table
                    </LoadingButton>
                  </Box>
                ) : (
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.5,
                    }}
                  >
                    {tables.length} {tables.length === 1 ? 'table' : 'tables'} available
                  </Typography>
                )}
              </Box>
              {!selectedTable && (
                <IconButton
                  onClick={() => fetchTables(selectedDb)}
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    boxShadow: 3,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>

            {/* Tables Grid */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                px: 3,
                pb: 3,
                mt: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 3,
                  maxWidth: '1400px',
                  margin: '0 auto',
                }}
              >
                {tables.map((table) => (
                  <Box
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    sx={{
                      position: 'relative',
                      height: '160px',
                      cursor: 'pointer',
                      bgcolor: 'background.paper',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: `1px solid ${alpha(theme.palette.primary.main, selectedTable === table ? 0.3 : 0.1)}`,
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
                        '& .table-icon': {
                          transform: 'scale(1.2) rotate(10deg)',
                        },
                        '& .table-bg': {
                          opacity: 0.15,
                        },
                        '& .table-content': {
                          transform: 'translateY(-4px)',
                        },
                      },
                    }}
                  >
                    {/* Background Pattern */}
                    <Box
                      className="table-bg"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: selectedTable === table ? 0.12 : 0.08,
                        transition: 'opacity 0.3s',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha(
                          theme.palette.secondary.main,
                          0.4
                        )} 100%)`,
                        backgroundSize: '400% 400%',
                        animation: 'gradient 15s ease infinite',
                      }}
                    />

                    {/* Content */}
                    <Box
                      className="table-content"
                      sx={{
                        position: 'relative',
                        height: '100%',
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.3s',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <TableIcon
                          className="table-icon"
                          sx={{
                            fontSize: 32,
                            color: 'primary.main',
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            mb: 2,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {table}
                        </Typography>
                      </Box>

                      {/* Card Footer */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: 'text.secondary',
                        }}
                      >
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          Click to view
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              color: 'text.secondary',
            }}
          >
            <DatabaseIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="h6">Select a database to view its tables</Typography>
          </Box>
        )}

        {selectedTable && tableStructure && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <TableViewer
              database={selectedDb}
              table={selectedTable}
              structure={tableStructure}
              onClose={() => setSelectedTable(null)}
            />
          </Box>
        )}
      </Box>

      {/* Create Database Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            minWidth: 400,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Create New Database</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mt: 2 }}>
              <input
                type="text"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={handleCreateDatabase}
            loading={isLoading}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #6C63FF, #FF6584)',
              '&:hover': {
                background: 'linear-gradient(45deg, #8B85FF, #FF8DA3)',
              },
            }}
          >
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Database Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Delete Database</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the database "{selectedDb}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            onClick={() => handleDeleteDatabase(selectedDb)}
            loading={isLoading}
            color="error"
            variant="contained"
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <ImportDialog />

      {/* Delete Table Dialog */}
      <Dialog
        open={deleteTableDialogOpen}
        onClose={() => !deletingTable && setDeleteTableDialogOpen(false)}
      >
        <DialogTitle>Delete Table</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the table "{tableToDelete}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTableDialogOpen(false)}
            disabled={deletingTable}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleConfirmDeleteTable}
            loading={deletingTable}
            color="error"
            variant="contained"
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Add keyframes for gradient animation */}
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
