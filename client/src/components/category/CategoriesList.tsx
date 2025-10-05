
import React, { useMemo } from "react";
import Typography from "@mui/material/Typography";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import {usePaginationController} from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import IconButton from "@mui/material/IconButton";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import {CategoryJson, ModalTypeEnum} from "../../model/PersofiModels";
import LoadingComponent from "../common/LoadingComponent";
import { useCategoryContext } from "../../context/CategoryContext";

interface CategoriesListProps {
    categories: CategoryJson[];
    openDialogWithType: (type: ModalTypeEnum, category: CategoryJson) => void;
    isLoading: boolean;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({categories, openDialogWithType, isLoading}) => {
    const paginationController = usePaginationController<CategoryJson>(categories);
    const { categories: allCategories } = useCategoryContext();

    const parentNameById = useMemo(() => {
        const map = new Map<number, string>();
        allCategories.forEach(c => map.set(c.id, c.name));
        return map;
    }, [allCategories]);

    if (isLoading) return <LoadingComponent message="Loading Categories" />;
    if (categories.length === 0) return <Typography>No Category Found</Typography>;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell><Typography variant="h6" fontSize="14px">Id</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Category Name</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Parent Category</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Active</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontSize="14px">Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paginationController.data.map((category) => (
                    <TableRow key={category.id}>
                        <TableCell>{category.id}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.parentCategoryId ? (parentNameById.get(category.parentCategoryId) ?? "—") : "—"}</TableCell>
                        <TableCell>
                            <IconButton color={category.active ? "success" : "error"}>
                                {category.active ? (
                                    <CheckIcon width={22} />
                                ) : (
                                    <ClearIcon width={22} />
                                )}
                            </IconButton>
                        </TableCell>
                        <TableCell align="right">
                            <EditButton
                                tooltipText={"Edit Category"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.UPDATE, category)}
                            />
                            <DeleteButton
                                tooltipText={"Delete Category"}
                                openDialogWithType={() => openDialogWithType(ModalTypeEnum.DELETE, category)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
            <Pagination paginationController={paginationController} />
        </Table>
    );
}
