import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import store from '@/reducers';
import { useViewerStore } from '@/state';
import { TableSortLabel } from '@mui/material';
import { useState } from 'react';
import { useEffect } from 'react';

function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

export default function DataTable({
  rows,
  columns,
  type,
  onSelectedRow = null,
}) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [selectedRow, setSelectedRow] = React.useState({});
  const [sortState, setSortState] = useState({
    sortKey: '',
    sortDirection: 'asc',
  });
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const globalSelection = useViewerStore((store) => store.globalSelection);

  const handleRowChange = () => {
    if (type == 'TabNaming') {
      const content = {
        channel: selectedRow.channel,
        col: selectedRow.col,
        row: selectedRow.row,
        field: selectedRow.field,
        z: selectedRow.z,
        time: selectedRow.time,
        id: 'Naming',
      };
      store.dispatch({ type: 'displayOptions', content: content });
    }

    if (type == 'TabMetadata') {
      const content = {
        dimensionOrder: selectedRow.DimensionOrder,
        sizeX: selectedRow.SizeX,
        sizeY: selectedRow.SizeY,
        sizeC: selectedRow.SizeC,
        sizeZ: selectedRow.SizeZ,
        sizeT: selectedRow.SizeT,
        type: selectedRow.Type,
        id: 'Metadata',
      };
      store.dispatch({ type: 'displayOptions', content: content });
    }
  };

  handleRowChange();

  const handleSort = (sortKey) => {
    setSortState((prevState) => {
      const isAsc =
        prevState.sortKey === sortKey && prevState.sortDirection === 'asc';
      return {
        sortKey,
        sortDirection: isAsc ? 'desc' : 'asc',
      };
    });
  };

  const sortArray = (field) => {
    if (sortState.sortDirection === 'desc')
      rows.sort((obj1, obj2) => obj1[field] - obj2[field]);
    else rows.sort((obj1, obj2) => obj2[field] - obj1[field]);
  };

  useEffect(() => {
    if (sortState.sortKey !== '') {
      const field = sortState.sortKey;
      sortArray(field);
    }
  }, [sortState]);

  useEffect(() => {
    if (rows.length > 0) {
      const firstRow = rows[0];
      const keysList = Object.keys(firstRow);
      if (keysList.length > 0) {
        sortArray(keysList[0]);
      }
    }
  }, []);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow>
            {type !== 'VisualDisplay' &&
              columns.map((col) => (
                <TableCell key={col.field} width={col.width}>
                  {col.headerName}
                </TableCell>
              ))}
            {type === 'VisualDisplay' &&
              columns.map((col) => (
                <TableCell key={col.field}>
                  <TableSortLabel
                    key={col.field}
                    active={sortState.sortKey === col.field}
                    direction={sortState.sortDirection}
                    onClick={() => {
                      handleSort(col.field);
                    }}
                  >
                    {col.headerName}
                  </TableSortLabel>
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0
            ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            : rows
          ).map((row) => (
            <TableRow
              key={row.id}
              onClick={() => {
                setSelectedRow(row);
                if (onSelectedRow) onSelectedRow(row);
              }}
              sx={{
                backgroundColor: row.id == selectedRow.id ? 'gray' : 'white',
              }}
            >
              {columns.map((col) => (
                <TableCell key={`cell-${row.id}-${col.field}`}>
                  {row[col.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}

          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={columns.length}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: {
                  'aria-label': 'rows per page',
                },
                native: true,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
