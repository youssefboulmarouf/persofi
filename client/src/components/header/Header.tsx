import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import React from "react";
import Box from "@mui/material/Box";
import {Stack} from "@mui/system";
import Profile from "./Profile";

const Header: React.FC = () => {
    const AppBarStyled = styled(AppBar)(({ theme }) => ({
        boxShadow: 'none',
        background: theme.palette.background.paper,
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        [theme.breakpoints.up('lg')]: {minHeight: 70,},
    }));
    const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
        width: '100%',
        color: theme.palette.text.secondary,
    }));

    return (
        <AppBarStyled position="sticky" color="default">
            <ToolbarStyled>
                <IconButton color="inherit">
                    <MenuIcon/>
                </IconButton>
                <Box flexGrow={1} />
                <Stack spacing={1} direction="row" alignItems="center">
                    <Profile />
                </Stack>
            </ToolbarStyled>
        </AppBarStyled>
    );
};

export default Header;
