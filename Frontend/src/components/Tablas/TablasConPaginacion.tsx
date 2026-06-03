import type { JSX } from "react";
import Paginacion from "./Paginacion";
import '../../../src/styles/Tablas/tablas.css';

interface TableWithPaginationProps<T> {
  data: T[];
  rowsPerPage: number;
  columns: {
    key: string;
    label: string;
    render?: (row: T) => JSX.Element | string;// Soporte para formato personalizado
    isActionColumn?: boolean;
  }[];
  renderActions?: (row: T) => JSX.Element;
}
 
const TableWithPagination = <T,>({
  data,
  rowsPerPage,
  columns,
}: TableWithPaginationProps<T>) => {
  const {
    currentData,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    goToPage,
  } = Paginacion({ data, rowsPerPage });
 
  return (
    <div>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map((row: T, index: number) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key} className={col.isActionColumn ? 'action-column' : ''}>
                    {col.render ? (
                      col.render(row)
                    ) : (
                      (row as any)[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
 
      {/* Paginación */}
      <div className="pagination">
        <button onClick={goToPreviousPage} disabled={currentPage === 1}>
          {"<"}
        </button>
 
        {currentPage > 2 && (
          <>
            <button onClick={() => goToPage(1)}>1</button>
            {currentPage > 3 && <span className="dots">...</span>}
          </>
        )}
 
        {[...Array(totalPages)]
          .map((_, i) => i + 1)
          .filter(
            (page) =>
              page === currentPage ||
              page === currentPage - 1 ||
              page === currentPage + 1
          )
          .map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={currentPage === page ? "active" : ""}
            >
              {page}
            </button>
          ))}
 
        {currentPage < totalPages - 1 && (
          <>
            {currentPage < totalPages - 2 && <span className="dots">...</span>}
            <button onClick={() => goToPage(totalPages)}>{totalPages}</button>
          </>
        )}
 
        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
          {">"}
        </button>
      </div>
    </div>
  );
};
 
export default TableWithPagination;