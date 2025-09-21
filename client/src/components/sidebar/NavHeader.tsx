import ListSubheader from '@mui/material/ListSubheader';
import {styled, Theme} from '@mui/material/styles';
import React from 'react';

interface NavHeaderProps {
    label: string;
}

const NavHeader: React.FC<NavHeaderProps> = ({label}) => {
    const ListSubheaderStyle = styled((props: Theme | any) => (
        <ListSubheader disableSticky {...props} />
    ))(({ theme }) => ({
        ...theme.typography.overline,
        fontWeight: '700',
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(0),
        color: theme.palette.primary.dark,
        lineHeight: '26px',
        padding: '3px 12px',
        marginLeft: '-10px',
    }));

    return (
        <ListSubheaderStyle>{label}</ListSubheaderStyle>
    );
};

export default NavHeader;
