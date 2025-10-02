import {useMemo, useState} from "react";

type RowsPerPageOptions = number | { value: number; label: string; }

export interface PaginationController<T> {
    data: T[];
    count: number;
    rowsPerPageOptions: RowsPerPageOptions[];
    rowsPerPage: number;
    page: number;
    changePage: (event: any, newPage: number) => void;
    changeRowsPerPage: (event: any) => void;
}

export const usePaginationController = <T>(listData: T[]): PaginationController<T> => {
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);
    const [rowsPerPageOptions] = useState<RowsPerPageOptions[]>([10, 25, 50, { label: "All", value: -1 }]);

    const count = listData.length;
    const sliceFrom = page * rowsPerPage;
    const sliceTo = page * rowsPerPage + rowsPerPage;

    const data = useMemo(() => {
        return rowsPerPage > 0
            ? listData.slice(sliceFrom, sliceTo)
            : listData;
    }, [listData, page, rowsPerPage]);

    const changePage = (event: any, newPage: number) => {
        setPage(newPage);
    };

    const changeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return {
        data,
        count,
        rowsPerPageOptions,
        rowsPerPage,
        page,
        changePage,
        changeRowsPerPage
    }
}