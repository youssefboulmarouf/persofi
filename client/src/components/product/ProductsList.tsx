import React, {Fragment, useMemo, useState} from "react";
import Typography from "@mui/material/Typography";
import {Collapse, Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import {usePaginationController} from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import LoadingComponent from "../common/LoadingComponent";
import {ModalTypeEnum, ProductJson, ProductVariantJson, UintTypeEnum} from "../../model/PersofiModels";
import { useCategoryContext } from "../../context/CategoryContext";
import AddButton from "../common/buttons/AddButton";

interface ProductsListProps {
    products: ProductJson[];
    openProductDialogWithType: (type: ModalTypeEnum, product: ProductJson) => void;
    openVariantDialogWithType: (type: ModalTypeEnum, variant: ProductVariantJson) => void;
    isLoading: boolean;
}

const emptyVariant: ProductVariantJson = {
    id: 0,
    productId: 0,
    unitSize: 0,
    unitType: UintTypeEnum.KG,
    description: "",
    active: true
};

export const ProductsList: React.FC<ProductsListProps> = ({products, openProductDialogWithType, openVariantDialogWithType, isLoading}) => {
    const paginationController = usePaginationController<ProductJson>(products);
    const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
    const { categories } = useCategoryContext();
    const categoryNameById = useMemo(() => new Map<number, string>(categories.map(c => [c.id, c.name])), [categories]);

    if (isLoading) return <LoadingComponent message="Loading Products and Variants" />;
    if (products.length === 0) return <Typography>No Products Found</Typography>;

    const toggleRow = (id: number) => setOpenRows(prev => ({...prev, [id]: !prev[id]}));

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell />
                    <TableCell><Typography variant="h6" fontSize="14px">Id</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Product Name</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Category</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Active</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontSize="14px">Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paginationController.data.map((product) => (
                    <Fragment key={product.id}>
                        <TableRow>
                            <TableCell>
                                <IconButton size="small" onClick={() => toggleRow(product.id)}>
                                    {openRows[product.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                            </TableCell>
                            <TableCell>{product.id}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{categoryNameById.get(product.categoryId) ?? "—"}</TableCell>
                            <TableCell>
                                <IconButton color={product.active ? "success" : "error"}>
                                    {product.active ? (
                                        <CheckIcon width={22} />
                                    ) : (
                                        <ClearIcon width={22} />
                                    )}
                                </IconButton>
                            </TableCell>
                            <TableCell align="right">
                                <AddButton
                                    tooltipText={"Add Variation"}
                                    openDialogWithType={() =>
                                        openVariantDialogWithType(ModalTypeEnum.ADD, emptyVariant)
                                    }
                                />
                                <EditButton
                                    tooltipText={"Edit Product"}
                                    openDialogWithType={() => openProductDialogWithType(ModalTypeEnum.UPDATE, product)}
                                />
                                <DeleteButton
                                    tooltipText={"Delete Product"}
                                    openDialogWithType={() => openProductDialogWithType(ModalTypeEnum.DELETE, product)}
                                />
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                <Collapse in={openRows[product.id]} timeout="auto" unmountOnExit>
                                    <Table size="small" sx={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><Typography variant="subtitle2">Variation Id</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2">Unit Size</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2">Unit Type</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                                                <TableCell><Typography variant="subtitle2">Active</Typography></TableCell>
                                                <TableCell align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(product.variants ?? []).map(variant => (
                                                <TableRow key={variant.id}>
                                                    <TableCell>{variant.id}</TableCell>
                                                    <TableCell>{variant.unitSize}</TableCell>
                                                    <TableCell>{variant.unitType}</TableCell>
                                                    <TableCell>{variant.description}</TableCell>
                                                    <TableCell>
                                                        <IconButton color={variant.active ? "success" : "error"}>
                                                            {variant.active ? (
                                                                <CheckIcon width={22} />
                                                            ) : (
                                                                <ClearIcon width={22} />
                                                            )}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <EditButton
                                                            tooltipText={"Edit Variation"}
                                                            openDialogWithType={() =>
                                                                openVariantDialogWithType(ModalTypeEnum.UPDATE, variant)
                                                            }
                                                        />
                                                        <DeleteButton
                                                            tooltipText={"Delete Variation"}
                                                            openDialogWithType={() =>
                                                                openVariantDialogWithType(ModalTypeEnum.DELETE, variant)
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Collapse>
                            </TableCell>
                        </TableRow>
                    </Fragment>
                ))}
            </TableBody>

            <Pagination paginationController={paginationController} />
        </Table>
    );
}
