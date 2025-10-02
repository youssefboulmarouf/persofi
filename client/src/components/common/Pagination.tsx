import {PaginationController} from "./usePaginationController";
import {TableFooter, TablePagination, TableRow} from "@mui/material";
import React from "react";

interface PaginationProps {
    paginationController: PaginationController<any>;
}

const Pagination: React.FC<PaginationProps> = ({paginationController}) => {
    return (
        <TableFooter>
            <TableRow>
                <TablePagination
                    rowsPerPageOptions={paginationController.rowsPerPageOptions}
                    count={paginationController.count}
                    rowsPerPage={paginationController.rowsPerPage}
                    page={paginationController.page}
                    onPageChange={paginationController.changePage}
                    onRowsPerPageChange={paginationController.changeRowsPerPage}
                />
            </TableRow>
        </TableFooter>
    );
}
export default Pagination;