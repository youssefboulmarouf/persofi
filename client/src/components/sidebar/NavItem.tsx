import React from 'react';

import List from '@mui/material/List';
import ListItemButton, { ListItemButtonProps } from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { styled, useTheme } from '@mui/material/styles';
import {Menu} from "../common/Menu";
import {Link, LinkProps} from "react-router-dom";

type ListItemLinkProps = ListItemButtonProps & LinkProps;

interface ItemType {
    item: Menu;
    selectedItemId: string;
    handleSelectedItem: (itemId: string) => void;
}

const NavItem: React.FC<ItemType> = ({ item, selectedItemId, handleSelectedItem }: ItemType)=>  {
    const theme = useTheme();

    const ListItemStyled = styled(ListItemButton)<ListItemLinkProps>(() => ({
        width: '100%',
        marginBottom: '2px',
        padding: '8px 10px',
        borderRadius: `7px`,
        paddingLeft: '10px',
        textAlign: 'left',
        justifyContent: 'flex-start',
        color: selectedItemId === item.id
            ? `white !important`
            : theme.palette.text.secondary,
        '&:hover': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
        },
        '&.Mui-selected': {
            color: 'white',
            backgroundColor: theme.palette.primary.main,
        },
    }));

    return (
        <List component="li" disablePadding>
            <ListItemStyled
                component={Link}
                to={item.href}
                selected={selectedItemId === item.id}
                onClick={() => handleSelectedItem(item.id)}
            >
                <ListItemText primary={item.title} />
            </ListItemStyled>
        </List>
    );
};

export default NavItem;